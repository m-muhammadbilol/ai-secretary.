const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const readline = require("node:readline");
const { spawn } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const services = [
  {
    name: "backend",
    cwd: path.join(rootDir, "backend"),
    env: {},
  },
  {
    name: "frontend",
    cwd: path.join(rootDir, "frontend"),
    env: {},
  },
];

const children = new Map();
let isShuttingDown = false;
let exitCode = 0;
let closedChildren = 0;

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const match = trimmedLine.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    let [, key, value] = match;
    value = value.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function log(message) {
  process.stdout.write(`${message}\n`);
}

function pipeOutput(stream, target, label) {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => {
    target.write(`[${label}] ${line}\n`);
  });
}

function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children.values()) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({
      host: "127.0.0.1",
      port,
    });

    const finish = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(1200);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

function isAiSecretaryBackendRunning(port) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path: "/api/health",
        method: "GET",
        timeout: 1500,
      },
      (res) => {
        let body = "";

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          try {
            const payload = JSON.parse(body);
            const isValid =
              res.statusCode === 200 &&
              payload &&
              payload.status === "ok" &&
              payload.services &&
              typeof payload.services === "object";
            resolve(Boolean(isValid));
          } catch {
            resolve(false);
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => {
      resolve(false);
    });
    req.end();
  });
}

function getBackendPort() {
  const backendEnv = readEnvFile(path.join(rootDir, "backend", ".env"));
  const rawPort = process.env.PORT || backendEnv.PORT || "5000";
  const parsedPort = Number.parseInt(rawPort, 10);

  if (Number.isNaN(parsedPort)) {
    return 5000;
  }

  return parsedPort;
}

async function findAvailablePort(startPort, attempts = 20) {
  for (let offset = 1; offset <= attempts; offset += 1) {
    const candidatePort = startPort + offset;
    const inUse = await isPortOpen(candidatePort);
    if (!inUse) {
      return candidatePort;
    }
  }

  return null;
}

async function resolveServicesToStart() {
  const backendPort = getBackendPort();
  const portInUse = await isPortOpen(backendPort);

  if (!portInUse) {
    return services;
  }

  const canReuseBackend = await isAiSecretaryBackendRunning(backendPort);
  if (canReuseBackend) {
    log(
      `[backend] Existing AI Secretary backend detected on http://localhost:${backendPort}. Reusing it.`
    );
    return services.filter((service) => service.name !== "backend");
  }

  const fallbackPort = await findAvailablePort(backendPort);
  if (!fallbackPort) {
    process.stderr.write(
      `[backend] Port ${backendPort} is already in use and no free fallback port was found nearby.\n`
    );
    process.exit(1);
  }

  log(
    `[backend] Port ${backendPort} is busy. Using fallback port ${fallbackPort} for this dev session.`
  );

  return services.map((service) => {
    if (service.name === "backend") {
      return {
        ...service,
        env: {
          ...service.env,
          PORT: String(fallbackPort),
        },
      };
    }

    if (service.name === "frontend") {
      return {
        ...service,
        env: {
          ...service.env,
          VITE_API_URL: `http://localhost:${fallbackPort}`,
        },
      };
    }

    return service;
  });
}

async function main() {
  const servicesToStart = await resolveServicesToStart();

  for (const service of servicesToStart) {
    const packageJsonPath = path.join(service.cwd, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      process.stderr.write(`Missing package.json: ${packageJsonPath}\n`);
      process.exit(1);
    }

    const child = spawn(npmCommand, ["run", "dev"], {
      cwd: service.cwd,
      env: {
        ...process.env,
        ...service.env,
      },
      stdio: ["inherit", "pipe", "pipe"],
    });

    children.set(service.name, child);
    pipeOutput(child.stdout, process.stdout, service.name);
    pipeOutput(child.stderr, process.stderr, service.name);

    child.on("error", (error) => {
      process.stderr.write(`[${service.name}] Failed to start: ${error.message}\n`);
      exitCode = 1;
      shutdown("SIGTERM");
    });

    child.on("exit", (code, signal) => {
      closedChildren += 1;

      if (!isShuttingDown) {
        if (signal) {
          process.stderr.write(`[${service.name}] Stopped with signal ${signal}\n`);
          exitCode = 1;
        } else if (code !== 0) {
          process.stderr.write(`[${service.name}] Exited with code ${code}\n`);
          exitCode = code || 1;
        }

        shutdown("SIGTERM");
      }

      if (closedChildren === servicesToStart.length) {
        process.exit(exitCode);
      }
    });
  }

  if (servicesToStart.length === 0) {
    log("No dev services needed to start.");
    process.exit(0);
  }

  const label = servicesToStart.map((service) => service.name).join(" and ");
  log(`Starting dev server${servicesToStart.length > 1 ? "s" : ""}: ${label}`);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    exitCode = 0;
    shutdown(signal);
  });
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});

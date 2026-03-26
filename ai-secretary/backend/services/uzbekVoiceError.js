function stringifyPayload(payload) {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return payload;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function formatUzbekVoiceError(serviceName, serviceUrl, error) {
  if (error.response) {
    const detail = stringifyPayload(error.response.data);
    return `${serviceName} so'rovi ${error.response.status} bilan tugadi${detail ? `: ${detail}` : "."}`;
  }

  if (error.code === "ENOTFOUND") {
    let host = serviceUrl;

    try {
      host = new URL(serviceUrl).host;
    } catch {
      // Keep the original URL string if parsing fails.
    }

    return `${serviceName} host topilmadi: ${host}. URL yoki DNS sozlamasini tekshiring.`;
  }

  if (error.code === "ECONNABORTED") {
    return `${serviceName} javobi kutish vaqtidan oshdi.`;
  }

  return error.message || `${serviceName} bilan bog'lanishda xato yuz berdi.`;
}

module.exports = { formatUzbekVoiceError };

import React, { useEffect, useState } from 'react';
import { checkHealth } from '../services/api.js';

export default function SettingsPage() {
  const [micPermission, setMicPermission] = useState('unknown');
  const [notifPermission, setNotifPermission] = useState('unknown');
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    // Check mic permission
    navigator.permissions?.query({ name: 'microphone' }).then((result) => {
      setMicPermission(result.state);
      result.onchange = () => setMicPermission(result.state);
    }).catch(() => setMicPermission('unknown'));

    // Check notification permission
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission('unsupported');
    }

    // Health check
    checkHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, []);

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission('granted');
    } catch {
      setMicPermission('denied');
    }
  };

  const requestNotif = async () => {
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Sozlamalar</h2>
      </div>

      {/* Permissions */}
      <Section title="Ruxsatlar">
        <PermRow
          label="Mikrofon"
          icon="🎙️"
          status={micPermission}
          onRequest={micPermission !== 'granted' ? requestMic : null}
        />
        <PermRow
          label="Bildirishnomalar"
          icon="🔔"
          status={notifPermission}
          onRequest={notifPermission !== 'granted' && notifPermission !== 'unsupported' ? requestNotif : null}
        />
      </Section>

      {/* Backend health */}
      <Section title="Tizim holati">
        {healthLoading ? (
          <p style={styles.loadingText}>Tekshirilmoqda...</p>
        ) : health ? (
          <>
            <InfoRow label="Server" value={health.status === 'ok' ? '✅ Ishlayapti' : '❌ Ishlamayapti'} />
            <InfoRow label="Gemini AI" value={health.services?.gemini ? '✅ Ulangan' : '❌ API key yo\'q'} />
            <InfoRow label="UzbekVoiceAI" value={health.services?.uzbekVoiceAI ? '✅ Ulangan' : '❌ API key yo\'q'} />
          </>
        ) : (
          <p style={styles.errorText}>Backend ulanmadi. Server ishlamayotgan bo'lishi mumkin.</p>
        )}
      </Section>

      {/* About */}
      <Section title="Ilova haqida">
        <InfoRow label="Ilova nomi" value="Kotib AI" />
        <InfoRow label="Versiya" value="1.0.0" />
        <InfoRow label="Til" value="O'zbek" />
        <InfoRow label="AI modeli" value="Gemini 1.5 Flash" />
        <InfoRow label="Ovoz texnologiyasi" value="UzbekVoiceAI" />
      </Section>

      {/* Tips */}
      <Section title="Maslahatlar">
        <div style={styles.tips}>
          {[
            '"Soat nechchi?" — vaqtni so\'rash',
            '"Task qo\'sh: ..."  — vazifa qo\'shish',
            '"3 da meetingim bor, har 5 minutda eslat" — takroriy eslatma',
            '"Bugungi rejalarimni ko\'rsat" — kun rejasi',
            '"Tasklarimni ko\'rsat" — vazifalar ro\'yxati',
          ].map((tip, i) => (
            <div key={i} style={styles.tip}>
              <span style={styles.tipDot}>•</span>
              <span style={styles.tipText}>{tip}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={sStyles.section}>
      <p style={sStyles.sectionTitle}>{title}</p>
      <div style={sStyles.sectionContent}>{children}</div>
    </div>
  );
}

function PermRow({ label, icon, status, onRequest }) {
  const statusMap = {
    granted: { text: 'Ruxsat berilgan', color: 'var(--success)' },
    denied: { text: 'Rad etilgan', color: 'var(--danger)' },
    prompt: { text: 'So\'ralishi kerak', color: 'var(--warning)' },
    unsupported: { text: 'Qo\'llab-quvvatlanmaydi', color: 'var(--text-muted)' },
    unknown: { text: 'Noma\'lum', color: 'var(--text-muted)' },
  };

  const { text, color } = statusMap[status] || statusMap.unknown;

  return (
    <div style={sStyles.row}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={sStyles.rowLabel}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <span style={{ fontSize: 12, color, fontWeight: 500 }}>{text}</span>
        {onRequest && (
          <button style={sStyles.grantBtn} onClick={onRequest}>
            Ruxsat
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={sStyles.row}>
      <span style={sStyles.rowLabel}>{label}</span>
      <span style={sStyles.rowValue}>{value}</span>
    </div>
  );
}

const styles = {
  page: {
    flex: 1,
    padding: '20px 20px',
    paddingBottom: 'calc(var(--nav-height) + 20px)',
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflowY: 'auto',
  },
  header: {
    paddingTop: 8,
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 24,
    fontWeight: 400,
    color: 'var(--text-primary)',
    letterSpacing: -0.3,
  },
  loadingText: { fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' },
  errorText: { fontSize: 13, color: 'var(--danger)', padding: '8px 0' },
  tips: { display: 'flex', flexDirection: 'column', gap: 8 },
  tip: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  tipDot: { color: 'var(--accent)', fontWeight: 700, flexShrink: 0, marginTop: 1 },
  tipText: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 },
};

const sStyles = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionContent: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '13px 16px',
    borderBottom: '1px solid var(--border)',
    ':last-child': { borderBottom: 'none' },
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  rowValue: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginLeft: 'auto',
  },
  grantBtn: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--white)',
    background: 'var(--accent)',
    borderRadius: 8,
    padding: '4px 10px',
    cursor: 'pointer',
    border: 'none',
  },
};

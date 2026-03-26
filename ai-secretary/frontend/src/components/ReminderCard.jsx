import React from 'react';

function formatTrigger(reminder) {
  if (reminder.repeatInterval) {
    return `Har ${reminder.repeatInterval} daqiqada`;
  }
  if (reminder.triggerAt) {
    return new Date(reminder.triggerAt).toLocaleString('uz-UZ', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return 'Bir martalik';
}

export default function ReminderCard({ reminder, onDeactivate }) {
  return (
    <div style={{
      ...styles.card,
      opacity: reminder.active ? 1 : 0.5,
      borderLeft: `3px solid ${reminder.active ? 'var(--warning)' : 'var(--border)'}`,
    }} className="fade-in">
      <div style={styles.iconWrap}>
        <span style={{ fontSize: 18 }}>{reminder.repeatInterval ? '🔄' : '⏰'}</span>
      </div>
      <div style={styles.content}>
        <p style={styles.title}>{reminder.title}</p>
        <span style={styles.time}>{formatTrigger(reminder)}</span>
        {!reminder.active && <span style={styles.badge}>Tugatilgan</span>}
      </div>
      {reminder.active && (
        <button
          style={styles.stopBtn}
          onClick={() => onDeactivate(reminder.id)}
          aria-label="To'xtatish"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="4" y="4" width="8" height="8" rx="1.5" fill="var(--warning)" />
          </svg>
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    transition: 'all 0.2s ease',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--warning-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
    margin: 0,
    lineHeight: 1.4,
  },
  time: {
    fontSize: 12,
    color: 'var(--warning)',
    fontWeight: 500,
    display: 'block',
    marginTop: 2,
  },
  badge: {
    fontSize: 11,
    color: 'var(--text-muted)',
    background: 'var(--surface)',
    borderRadius: 4,
    padding: '1px 6px',
    display: 'inline-block',
    marginTop: 4,
  },
  stopBtn: {
    padding: 6,
    borderRadius: 8,
    background: 'var(--warning-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
};

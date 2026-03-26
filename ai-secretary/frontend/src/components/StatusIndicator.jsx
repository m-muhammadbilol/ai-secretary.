import React from 'react';

const STATUS_MESSAGES = {
  ready: 'Tayyor',
  listening: 'Tinglamoqda...',
  thinking: 'O\'ylamoqda...',
  speaking: 'Gapirmoqda...',
  error: 'Xato yuz berdi',
};

const STATUS_DOT_COLORS = {
  ready: '#16a34a',
  listening: '#dc2626',
  thinking: '#d97706',
  speaking: '#2563eb',
  error: '#6b6b68',
};

export default function StatusIndicator({ status }) {
  const message = STATUS_MESSAGES[status] || 'Tayyor';
  const dotColor = STATUS_DOT_COLORS[status] || '#16a34a';
  const isPulsing = status === 'listening' || status === 'speaking';

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.dot,
          background: dotColor,
          animation: isPulsing ? 'breathe 1s ease-in-out infinite' : 'none',
        }}
      />
      <span style={styles.text}>{message}</span>
    </div>
  );
}

const styles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--surface)',
    borderRadius: 'var(--radius-full)',
    padding: '6px 14px',
    border: '1px solid var(--border)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  text: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    letterSpacing: 0.3,
  },
};

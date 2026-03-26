import React from 'react';

const STATUS_COLORS = {
  ready: { bg: 'var(--accent)', shadow: '0 8px 32px rgba(37,99,235,0.35)' },
  listening: { bg: '#dc2626', shadow: '0 8px 32px rgba(220,38,38,0.45)' },
  thinking: { bg: '#d97706', shadow: '0 8px 32px rgba(217,119,6,0.35)' },
  speaking: { bg: '#16a34a', shadow: '0 8px 32px rgba(22,163,74,0.35)' },
  error: { bg: '#6b6b68', shadow: '0 8px 32px rgba(107,107,104,0.25)' },
};

export default function MicButton({ status, onPress, disabled }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.ready;
  const isListening = status === 'listening';
  const isThinking = status === 'thinking';
  const isSpeaking = status === 'speaking';

  return (
    <div style={styles.container}>
      {/* Pulse rings when listening */}
      {isListening && (
        <>
          <div style={{ ...styles.ring, animationDelay: '0s' }} />
          <div style={{ ...styles.ring, animationDelay: '0.4s' }} />
        </>
      )}

      <button
        style={{
          ...styles.button,
          background: colors.bg,
          boxShadow: colors.shadow,
          animation: isListening ? 'breathe 1.5s ease-in-out infinite' : 'none',
          transform: disabled ? 'scale(0.95)' : 'scale(1)',
          opacity: disabled && !isListening ? 0.7 : 1,
        }}
        onClick={onPress}
        disabled={disabled}
        aria-label="Mikrofon"
      >
        {isThinking ? (
          <ThinkingIcon />
        ) : isSpeaking ? (
          <SpeakingIcon />
        ) : (
          <MicIcon isListening={isListening} />
        )}
      </button>
    </div>
  );
}

function MicIcon({ isListening }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="white" />
      <path
        d="M5 11C5 14.866 8.134 18 12 18C15.866 18 19 14.866 19 11"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="12" y1="18" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ThinkingIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1.2s linear infinite' }}>
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SpeakingIcon() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: 24,
            background: 'white',
            borderRadius: 4,
            animation: `wave 0.8s ease-in-out infinite`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 96,
    height: 96,
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: '50%',
    background: 'rgba(220,38,38,0.2)',
    animation: 'pulse-ring 1.5s ease-out infinite',
  },
  button: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    zIndex: 1,
    outline: 'none',
    border: '3px solid rgba(255,255,255,0.25)',
  },
};

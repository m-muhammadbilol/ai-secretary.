import React from 'react';
import AssistantDataTable from './AssistantDataTable.jsx';

export default function ResponseBubble({ transcript, replyText, intent, uiData }) {
  if (!transcript && !replyText && !uiData) return null;

  return (
    <div style={styles.container} className="fade-in">
      {transcript && (
        <div style={styles.userBubble}>
          <p style={styles.userText}>{transcript}</p>
        </div>
      )}
      {(replyText || uiData) && (
        <div style={styles.assistantBubble}>
          <div style={styles.avatar}>
            <span style={{ fontSize: 14 }}>✨</span>
          </div>
          <div style={styles.assistantCard}>
            {replyText ? <p style={styles.assistantText}>{replyText}</p> : null}
            <AssistantDataTable uiData={uiData} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    maxWidth: 420,
    padding: '0 4px',
  },
  userBubble: {
    alignSelf: 'flex-end',
    background: 'var(--accent)',
    borderRadius: '18px 18px 4px 18px',
    padding: '10px 14px',
    maxWidth: '85%',
  },
  userText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    maxWidth: '100%',
    width: '100%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--accent-light)',
    border: '1.5px solid var(--accent-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  assistantCard: {
    background: 'var(--white)',
    borderRadius: '18px 18px 18px 4px',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minWidth: 0,
  },
  assistantText: {
    fontSize: 14,
    lineHeight: 1.6,
    margin: 0,
  },
};

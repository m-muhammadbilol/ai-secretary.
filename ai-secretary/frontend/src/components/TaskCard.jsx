import React from 'react';

export default function TaskCard({ task, onComplete, onDelete }) {
  const createdDate = new Date(task.createdAt).toLocaleDateString('uz-UZ', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div style={{ ...styles.card, opacity: task.completed ? 0.6 : 1 }} className="fade-in">
      <button
        style={{
          ...styles.checkbox,
          background: task.completed ? 'var(--accent)' : 'transparent',
          borderColor: task.completed ? 'var(--accent)' : 'var(--border)',
        }}
        onClick={() => !task.completed && onComplete(task.id)}
        aria-label="Bajarildi"
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div style={styles.content}>
        <p style={{
          ...styles.title,
          textDecoration: task.completed ? 'line-through' : 'none',
          color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
        }}>
          {task.title}
        </p>
        {task.description && (
          <p style={styles.description}>{task.description}</p>
        )}
        <span style={styles.date}>{createdDate}</span>
      </div>

      <button style={styles.deleteBtn} onClick={() => onDelete(task.id)} aria-label="O'chirish">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4L12 12M12 4L4 12" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

const styles = {
  card: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    transition: 'all 0.2s ease',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    border: '2px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.4,
    margin: 0,
    transition: 'all 0.15s ease',
  },
  description: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginTop: 3,
    lineHeight: 1.4,
  },
  date: {
    fontSize: 11,
    color: 'var(--text-muted)',
    display: 'block',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    opacity: 0.6,
    transition: 'opacity 0.15s',
    cursor: 'pointer',
  },
};

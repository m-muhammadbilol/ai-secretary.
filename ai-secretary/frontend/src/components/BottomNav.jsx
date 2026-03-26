import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Bosh sahifa',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
          fill={active ? 'var(--accent)' : 'none'}
          stroke={active ? 'var(--accent)' : 'var(--text-muted)'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    path: '/tasks',
    label: 'Vazifalar',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="3" width="18" height="18" rx="4"
          fill={active ? 'var(--accent-light)' : 'none'}
          stroke={active ? 'var(--accent)' : 'var(--text-muted)'}
          strokeWidth="1.8"
        />
        <path
          d="M8 12L11 15L16 9"
          stroke={active ? 'var(--accent)' : 'var(--text-muted)'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Sozlamalar',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="12" r="3"
          stroke={active ? 'var(--accent)' : 'var(--text-muted)'}
          strokeWidth="1.8"
        />
        <path
          d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke={active ? 'var(--accent)' : 'var(--text-muted)'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            style={{ ...styles.item, ...(active ? styles.activeItem : {}) }}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span style={styles.iconWrap}>{item.icon(active)}</span>
            <span style={{ ...styles.label, color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 'var(--nav-height)',
    background: 'var(--white)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '8px 20px',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.15s ease',
    minWidth: 72,
  },
  activeItem: {
    background: 'var(--accent-light)',
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: 0.2,
    transition: 'color 0.15s ease',
  },
};

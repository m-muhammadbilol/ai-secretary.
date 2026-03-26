import React, { useEffect, useState } from 'react';
import TaskCard from '../components/TaskCard.jsx';
import ReminderCard from '../components/ReminderCard.jsx';
import { useApp } from '../context/AppContext.jsx';
import { fetchTasks, completeTaskApi, deleteTaskApi, fetchReminders, deactivateReminderApi } from '../services/api.js';

export default function TasksPage() {
  const { tasks, reminders, setAllTasks, updateTask, removeTask, setAllReminders, updateReminder } = useApp();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tasks');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTasks(), fetchReminders()])
      .then(([tasksData, remindersData]) => {
        setAllTasks(tasksData.tasks || []);
        setAllReminders(remindersData.reminders || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleComplete = async (id) => {
    try {
      const { task } = await completeTaskApi(id);
      updateTask(task);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTaskApi(id);
      removeTask(id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const { reminder } = await deactivateReminderApi(id);
      updateReminder(reminder);
    } catch (err) {
      setError(err.message);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const activeReminders = reminders.filter((r) => r.active);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Mening ishlarim</h2>
        <span style={styles.count}>
          {tab === 'tasks' ? `${pendingTasks.length} ta` : `${activeReminders.length} ta`}
        </span>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(tab === 'tasks' ? styles.activeTab : {}) }}
          onClick={() => setTab('tasks')}
        >
          Vazifalar
        </button>
        <button
          style={{ ...styles.tab, ...(tab === 'reminders' ? styles.activeTab : {}) }}
          onClick={() => setTab('reminders')}
        >
          Eslatmalar
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={styles.loadingWrap}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Yuklanmoqda...</p>
        </div>
      ) : (
        <div style={styles.list}>
          {tab === 'tasks' && (
            <>
              {pendingTasks.length === 0 && completedTasks.length === 0 && (
                <EmptyState icon="📋" text="Hozircha vazifalar yo'q" sub="Mikrofon orqali vazifa qo'shing" />
              )}
              {pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
              ))}
              {completedTasks.length > 0 && (
                <>
                  <p style={styles.sectionLabel}>Bajarilgan</p>
                  {completedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} />
                  ))}
                </>
              )}
            </>
          )}

          {tab === 'reminders' && (
            <>
              {reminders.length === 0 && (
                <EmptyState icon="⏰" text="Eslatmalar yo'q" sub="Mikrofon orqali eslatma qo'shing" />
              )}
              {activeReminders.map((r) => (
                <ReminderCard key={r.id} reminder={r} onDeactivate={handleDeactivate} />
              ))}
              {reminders.filter((r) => !r.active).map((r) => (
                <ReminderCard key={r.id} reminder={r} onDeactivate={handleDeactivate} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={styles.empty}>
      <span style={{ fontSize: 40 }}>{icon}</span>
      <p style={styles.emptyText}>{text}</p>
      <p style={styles.emptySub}>{sub}</p>
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
    gap: 16,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 24,
    fontWeight: 400,
    color: 'var(--text-primary)',
    letterSpacing: -0.3,
  },
  count: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 12px',
  },
  tabs: {
    display: 'flex',
    background: 'var(--surface)',
    borderRadius: 'var(--radius-sm)',
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: 'transparent',
  },
  activeTab: {
    background: 'var(--white)',
    color: 'var(--accent)',
    boxShadow: 'var(--shadow-sm)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '48px 20px',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  emptySub: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  errorBox: {
    background: 'var(--danger-light)',
    border: '1px solid #fecaca',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 16px',
  },
  errorText: {
    fontSize: 13,
    color: 'var(--danger)',
    margin: 0,
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '48px 0',
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid var(--border)',
    borderTop: '3px solid var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
};

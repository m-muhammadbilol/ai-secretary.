import React from 'react';

function formatDate(value, options) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('uz-UZ', options);
}

function formatReminderSchedule(reminder) {
  if (reminder.repeatInterval) {
    return `Har ${reminder.repeatInterval} daqiqada`;
  }

  if (reminder.triggerAt) {
    return formatDate(reminder.triggerAt, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return 'Bir martalik';
}

function getTaskRows(tasks) {
  return tasks.map((task, index) => ({
    id: task.id || `task-${index}`,
    order: index + 1,
    primary: task.title,
    secondary: task.description,
    schedule: formatDate(task.createdAt, {
      month: 'short',
      day: 'numeric',
    }),
    status: task.completed ? 'Bajarilgan' : 'Faol',
  }));
}

function getReminderRows(reminders) {
  return reminders.map((reminder, index) => ({
    id: reminder.id || `reminder-${index}`,
    order: index + 1,
    primary: reminder.title,
    secondary: reminder.notes,
    schedule: formatReminderSchedule(reminder),
    status: reminder.active ? 'Faol' : 'To‘xtatilgan',
  }));
}

function DataSection({ title, emptyText, rows }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>{title}</span>
        <span style={styles.sectionCount}>{rows.length} ta</span>
      </div>

      {rows.length === 0 ? (
        <div style={styles.emptyState}>{emptyText}</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.headCell, ...styles.orderCell }}>#</th>
                <th style={styles.headCell}>Nomi</th>
                <th style={styles.headCell}>Vaqti</th>
                <th style={styles.headCell}>Holat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ ...styles.bodyCell, ...styles.orderCell }}>{row.order}</td>
                  <td style={styles.bodyCell}>
                    <div style={styles.primaryText}>{row.primary}</div>
                    {row.secondary ? <div style={styles.secondaryText}>{row.secondary}</div> : null}
                  </td>
                  <td style={styles.bodyCell}>
                    <span style={styles.scheduleText}>{row.schedule}</span>
                  </td>
                  <td style={styles.bodyCell}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(row.status === 'Faol' ? styles.activeBadge : styles.mutedBadge),
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AssistantDataTable({ uiData }) {
  if (!uiData?.type) return null;

  if (uiData.type === 'tasks') {
    return (
      <DataSection
        title="Vazifalar"
        emptyText="Hozircha vazifalar topilmadi."
        rows={getTaskRows(uiData.tasks || [])}
      />
    );
  }

  if (uiData.type === 'reminders') {
    return (
      <DataSection
        title="Eslatmalar"
        emptyText="Hozircha eslatmalar topilmadi."
        rows={getReminderRows(uiData.reminders || [])}
      />
    );
  }

  if (uiData.type === 'agenda_today' || uiData.type === 'agenda_tomorrow') {
    const taskRows = getTaskRows(uiData.tasks || []);
    const reminderRows = getReminderRows(uiData.reminders || []);

    return (
      <div style={styles.agendaWrap}>
        <DataSection
          title="Vazifalar"
          emptyText="Bu kun uchun vazifa yo‘q."
          rows={taskRows}
        />
        <DataSection
          title="Eslatmalar"
          emptyText="Bu kun uchun eslatma yo‘q."
          rows={reminderRows}
        />
      </div>
    );
  }

  return null;
}

const styles = {
  agendaWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: 0.2,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    borderRadius: 'var(--radius-full)',
    padding: '2px 8px',
  },
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--off-white)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 320,
  },
  headCell: {
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    whiteSpace: 'nowrap',
  },
  bodyCell: {
    fontSize: 12,
    color: 'var(--text-primary)',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
    verticalAlign: 'top',
  },
  orderCell: {
    width: 28,
    textAlign: 'center',
  },
  primaryText: {
    fontWeight: 600,
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  secondaryText: {
    fontSize: 11,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    marginTop: 2,
    wordBreak: 'break-word',
  },
  scheduleText: {
    display: 'inline-block',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-full)',
    padding: '3px 8px',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  activeBadge: {
    color: 'var(--success)',
    background: 'var(--success-light)',
  },
  mutedBadge: {
    color: 'var(--text-secondary)',
    background: 'var(--surface)',
  },
  emptyState: {
    borderRadius: 12,
    border: '1px dashed var(--border)',
    padding: '12px 14px',
    fontSize: 12,
    color: 'var(--text-secondary)',
    background: 'var(--off-white)',
  },
};

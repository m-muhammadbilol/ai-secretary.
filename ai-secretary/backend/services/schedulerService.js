const {
  getActiveReminders,
  setReminderInterval,
  clearReminderInterval,
  deactivateReminder,
} = require('./store');

// In-memory scheduled reminders
// Each entry: { reminderId, intervalHandle }
const scheduledReminders = new Map();

/**
 * Schedule a repeating reminder (interval in minutes)
 * Returns a cleanup function
 */
function scheduleRepeatingReminder(reminder, onTrigger) {
  const intervalMs = reminder.repeatInterval * 60 * 1000;

  const handle = setInterval(() => {
    if (!reminder.active) {
      clearInterval(handle);
      scheduledReminders.delete(reminder.id);
      return;
    }
    onTrigger(reminder);
  }, intervalMs);

  scheduledReminders.set(reminder.id, handle);
  setReminderInterval(reminder.id, handle);

  return () => {
    clearInterval(handle);
    scheduledReminders.delete(reminder.id);
    clearReminderInterval(reminder.id);
  };
}

/**
 * Schedule a one-time reminder at triggerAt (ISO string)
 */
function scheduleOneTimeReminder(reminder, onTrigger) {
  const triggerTime = new Date(reminder.triggerAt).getTime();
  const now = Date.now();
  const delay = triggerTime - now;

  if (delay <= 0) {
    // Already past, trigger immediately
    onTrigger(reminder);
    return () => {};
  }

  const handle = setTimeout(() => {
    if (reminder.active) {
      onTrigger(reminder);
      deactivateReminder(reminder.id);
    }
  }, delay);

  return () => clearTimeout(handle);
}

/**
 * Smart scheduler: handles both repeating and one-time
 */
function scheduleReminder(reminder, onTrigger) {
  if (reminder.repeatInterval) {
    return scheduleRepeatingReminder(reminder, onTrigger);
  } else if (reminder.triggerAt) {
    return scheduleOneTimeReminder(reminder, onTrigger);
  }
  return () => {};
}

function cancelScheduledReminder(reminderId) {
  const handle = scheduledReminders.get(reminderId);
  if (handle) {
    clearInterval(handle);
    clearTimeout(handle);
    scheduledReminders.delete(reminderId);
  }
  clearReminderInterval(reminderId);
}

module.exports = { scheduleReminder, cancelScheduledReminder };

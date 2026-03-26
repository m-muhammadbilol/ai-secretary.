const { v4: uuidv4 } = require('uuid');

// In-memory store (use a real DB like MongoDB/Supabase for production persistence)
const store = {
  tasks: [],
  reminders: [],
  activeIntervals: {}, // reminderID -> setInterval handle
};

// ========== TASKS ==========
function createTask(title, description = '') {
  const task = {
    id: uuidv4(),
    title,
    description,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  store.tasks.push(task);
  return task;
}

function getTasks() {
  return [...store.tasks];
}

function completeTask(index) {
  // index is 1-based from user speech
  const realIndex = parseInt(index) - 1;
  if (realIndex >= 0 && realIndex < store.tasks.length) {
    store.tasks[realIndex].completed = true;
    return store.tasks[realIndex];
  }
  return null;
}

function completeTaskById(id) {
  const task = store.tasks.find(t => t.id === id);
  if (task) {
    task.completed = true;
    return task;
  }
  return null;
}

function deleteTask(id) {
  const idx = store.tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    const removed = store.tasks.splice(idx, 1);
    return removed[0];
  }
  return null;
}

function deleteTaskBySelector(selector = {}) {
  if (selector.id) {
    return deleteTask(selector.id);
  }

  if (selector.index != null) {
    const realIndex = parseInt(selector.index, 10) - 1;
    if (realIndex >= 0 && realIndex < store.tasks.length) {
      const removed = store.tasks.splice(realIndex, 1);
      return removed[0];
    }
  }

  if (selector.title) {
    const normalizedTitle = selector.title.trim().toLowerCase();
    const idx = store.tasks.findIndex((task) => task.title.trim().toLowerCase() === normalizedTitle);
    if (idx !== -1) {
      const removed = store.tasks.splice(idx, 1);
      return removed[0];
    }
  }

  return null;
}

// ========== REMINDERS ==========
function createReminder({ title, triggerAt, repeatInterval, notes }) {
  const reminder = {
    id: uuidv4(),
    title,
    triggerAt: triggerAt || null, // ISO string or null
    repeatInterval: repeatInterval || null, // minutes
    notes: notes || '',
    active: true,
    createdAt: new Date().toISOString(),
    nextTrigger: triggerAt || null,
  };
  store.reminders.push(reminder);
  return reminder;
}

function getReminders() {
  return [...store.reminders];
}

function getActiveReminders() {
  return store.reminders.filter(r => r.active);
}

function deactivateReminder(id) {
  const r = store.reminders.find(r => r.id === id);
  if (r) {
    r.active = false;
    clearReminderInterval(id);
    return r;
  }
  return null;
}

function deleteReminderBySelector(selector = {}) {
  let reminder = null;

  if (selector.id) {
    reminder = deactivateReminder(selector.id);
  } else if (selector.index != null) {
    const realIndex = parseInt(selector.index, 10) - 1;
    if (realIndex >= 0 && realIndex < store.reminders.length) {
      reminder = deactivateReminder(store.reminders[realIndex].id);
    }
  } else if (selector.title) {
    const normalizedTitle = selector.title.trim().toLowerCase();
    const found = store.reminders.find(
      (item) => item.title.trim().toLowerCase() === normalizedTitle
    );
    if (found) {
      reminder = deactivateReminder(found.id);
    }
  }

  return reminder;
}

function setReminderInterval(id, handle) {
  store.activeIntervals[id] = handle;
}

function clearReminderInterval(id) {
  if (store.activeIntervals[id]) {
    clearInterval(store.activeIntervals[id]);
    delete store.activeIntervals[id];
  }
}

// ========== AGENDA ==========
function getTodayAgenda() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tasks = store.tasks.filter(t => !t.completed);
  const reminders = store.reminders.filter(r => {
    if (!r.active) return false;
    if (!r.triggerAt) return r.repeatInterval != null;
    return r.triggerAt.startsWith(todayStr);
  });

  return { tasks, reminders };
}

function getTomorrowAgenda() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const reminders = store.reminders.filter(r => {
    if (!r.active || !r.triggerAt) return false;
    return r.triggerAt.startsWith(tomorrowStr);
  });

  const tasks = store.tasks.filter(t => !t.completed);
  return { tasks, reminders };
}

module.exports = {
  createTask,
  getTasks,
  completeTask,
  completeTaskById,
  deleteTask,
  deleteTaskBySelector,
  createReminder,
  getReminders,
  getActiveReminders,
  deactivateReminder,
  deleteReminderBySelector,
  setReminderInterval,
  clearReminderInterval,
  getTodayAgenda,
  getTomorrowAgenda,
};

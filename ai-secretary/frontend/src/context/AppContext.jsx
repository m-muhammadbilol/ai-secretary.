import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [lastResponse, setLastResponse] = useState(null);
  const [theme, setTheme] = useState('light');

  const addTask = useCallback((task) => {
    setTasks((prev) => [task, ...prev]);
  }, []);

  const updateTask = useCallback((updatedTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  }, []);

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setAllTasks = useCallback((taskList) => {
    setTasks(taskList);
  }, []);

  const addReminder = useCallback((reminder) => {
    setReminders((prev) => [reminder, ...prev]);
  }, []);

  const updateReminder = useCallback((updatedReminder) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === updatedReminder.id ? updatedReminder : r))
    );
  }, []);

  const setAllReminders = useCallback((list) => {
    setReminders(list);
  }, []);

  const handleAssistantResult = useCallback((result) => {
    setLastResponse(result);
    if (!result?.uiData) return;

    const { type } = result.uiData;

    if (type === 'task_created') {
      addTask(result.uiData.task);
    } else if (type === 'tasks') {
      setAllTasks(result.uiData.tasks);
    } else if (type === 'task_completed') {
      if (result.uiData.task) updateTask(result.uiData.task);
    } else if (type === 'reminder_created') {
      addReminder(result.uiData.reminder);
    } else if (type === 'reminders') {
      setAllReminders(result.uiData.reminders);
    } else if (type === 'task_deleted') {
      if (result.uiData.task?.id) removeTask(result.uiData.task.id);
    } else if (type === 'reminder_deleted') {
      if (result.uiData.reminder) updateReminder(result.uiData.reminder);
    } else if (type === 'agenda_today' || type === 'agenda_tomorrow') {
      if (result.uiData.tasks) setAllTasks(result.uiData.tasks);
      if (result.uiData.reminders) setAllReminders(result.uiData.reminders);
    } else if (type === 'theme_updated' && result.uiData.theme) {
      setTheme(result.uiData.theme);
    }
  }, [addTask, setAllTasks, updateTask, addReminder, setAllReminders, removeTask, updateReminder]);

  return (
    <AppContext.Provider
      value={{
        tasks,
        reminders,
        lastResponse,
        theme,
        setTheme,
        addTask,
        updateTask,
        removeTask,
        setAllTasks,
        addReminder,
        updateReminder,
        setAllReminders,
        handleAssistantResult,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

const express = require('express');
const { processWithGemini } = require('../services/geminiService');
const { buildFallbackAssistantResult } = require('../services/assistantFallback');
const {
  refineAssistantResult,
  resolvePendingInteraction,
} = require('../services/conversationResolver');
const {
  getAssistantContext,
  rememberTurn,
  setPendingInteraction,
  clearPendingInteraction,
} = require('../services/assistantSession');
const {
  createTask,
  getTasks,
  completeTask,
  deleteTaskBySelector,
  createReminder,
  getReminders,
  deleteReminderBySelector,
  getTodayAgenda,
  getTomorrowAgenda,
} = require('../services/store');
const { scheduleReminder, cancelScheduledReminder } = require('../services/schedulerService');

const router = express.Router();

// Active reminder triggers - broadcast via SSE or just log
const reminderTriggers = [];

function normalizeDeleteConfirmationTarget(target) {
  if (!target) return null;
  if (target === 'delete_task') return 'delete_task';
  if (target === 'delete_reminder') return 'delete_reminder';
  if (target === 'delete_meeting') return 'delete_meeting';
  return null;
}

router.post('/', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.json({
        replyText: 'Sizni yaxshi tushunmadim. Iltimos, yana bir bor ayting.',
        intent: 'error',
        uiData: null,
      });
    }

    const assistantContext = getAssistantContext();

    const localFollowUp = resolvePendingInteraction(transcript.trim(), assistantContext);
    let geminiResult = localFollowUp;

    // Step 1: Send exact transcript to Gemini, with graceful local fallback.
    if (!geminiResult) {
      try {
        geminiResult = await processWithGemini(transcript.trim(), assistantContext);
      } catch (error) {
        console.warn('Assistant fallback triggered:', error.message);
        geminiResult = buildFallbackAssistantResult(transcript.trim(), error);
      }
    }

    geminiResult = refineAssistantResult(transcript.trim(), geminiResult, assistantContext);

    const { intent, replyText, action, meta = {} } = geminiResult;

    // Step 2: Execute action
    let uiData = null;

    const shouldExecuteAction =
      action &&
      action.type !== 'none' &&
      action.type !== 'chat' &&
      action.type !== 'ask_missing_info' &&
      !meta.requiresConfirmation;

    if (shouldExecuteAction) {
      switch (action.type) {
        case 'create_task': {
          const task = createTask(action.data.title, action.data.description || '');
          uiData = { type: 'task_created', task };
          clearPendingInteraction();
          break;
        }

        case 'list_tasks': {
          const tasks = getTasks();
          uiData = { type: 'tasks', tasks };
          break;
        }

        case 'complete_task': {
          let completed = null;
          if (action.data.index) {
            completed = completeTask(action.data.index);
          }
          uiData = { type: 'task_completed', task: completed };
          clearPendingInteraction();
          break;
        }

        case 'delete_task': {
          const deletedTask = deleteTaskBySelector(action.data || {});
          uiData = { type: 'task_deleted', task: deletedTask };
          clearPendingInteraction();
          break;
        }

        case 'create_reminder':
        case 'create_meeting': {
          const reminder = createReminder({
            title: action.data.title,
            triggerAt: action.data.triggerAt || null,
            repeatInterval: action.data.repeatInterval || null,
            notes: action.data.notes || '',
          });

          // Schedule it
          scheduleReminder(reminder, (r) => {
            console.log(`⏰ Reminder triggered: ${r.title}`);
            reminderTriggers.push({ reminder: r, triggeredAt: new Date().toISOString() });
          });

          uiData = { type: 'reminder_created', reminder };
          clearPendingInteraction();
          break;
        }

        case 'list_reminders': {
          const reminders = getReminders();
          uiData = { type: 'reminders', reminders };
          break;
        }

        case 'delete_reminder':
        case 'delete_meeting': {
          const reminder = deleteReminderBySelector(action.data || {});
          if (reminder?.id) {
            cancelScheduledReminder(reminder.id);
          }
          uiData = { type: 'reminder_deleted', reminder };
          clearPendingInteraction();
          break;
        }

        case 'get_today_agenda': {
          const agenda = getTodayAgenda();
          uiData = { type: 'agenda_today', ...agenda };
          break;
        }

        case 'get_tomorrow_agenda': {
          const agenda = getTomorrowAgenda();
          uiData = { type: 'agenda_tomorrow', ...agenda };
          break;
        }

        case 'set_theme': {
          uiData = {
            type: 'theme_updated',
            theme: action.data.theme || null,
          };
          clearPendingInteraction();
          break;
        }

        default:
          break;
      }
    }

    if (action?.type === 'ask_missing_info') {
      setPendingInteraction({
        reason: 'missing_info',
        action: action.data?.targetAction || meta.structuredAction || action.type,
        data: action.data || {},
        confirmationTarget: null,
      });
    } else if (meta.requiresConfirmation) {
      setPendingInteraction({
        reason: 'confirmation',
        action: meta.structuredAction || action?.type || null,
        data: action?.data || {},
        confirmationTarget: normalizeDeleteConfirmationTarget(meta.confirmationTarget),
      });
    } else if (action?.type === 'chat') {
      const lowerReply = (replyText || '').toLowerCase();
      if (/bekor|to'xtat|bo'lmaydi|kerak emas/.test(lowerReply)) {
        clearPendingInteraction();
      }
    }

    // Handle time/date intents on backend
    if (intent === 'time_check') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      // replyText already comes from Gemini with proper response
      uiData = { type: 'time', time: timeStr };
    }

    if (intent === 'date_check') {
      const now = new Date();
      const dateStr = now.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      uiData = { type: 'date', date: dateStr };
    }

    rememberTurn({
      user: transcript.trim(),
      assistant: replyText || 'Xizmatdaman!',
      action: meta.structuredAction || action?.type || null,
      data: action?.data || {},
    });

    res.json({
      replyText: replyText || 'Xizmatdaman!',
      intent,
      uiData,
      transcript,
      assistantMeta: {
        requiresConfirmation: meta.requiresConfirmation || false,
        confirmationTarget: meta.confirmationTarget || null,
        tone: meta.tone || 'friendly',
        speak: meta.speak !== false,
        playSound: meta.playSound || false,
        soundType: meta.soundType || null,
        showSticker: meta.showSticker || false,
        stickerType: meta.stickerType || null,
        actionName: meta.structuredAction || action?.type || null,
        data: meta.structuredData || action?.data || {},
      },
    });
  } catch (err) {
    console.error('Assistant error:', err.message);
    res.status(500).json({
      replyText: 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
      intent: 'error',
      uiData: null,
      detail: err.message,
    });
  }
});

// SSE endpoint for real-time reminder triggers
router.get('/triggers', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const intervalId = setInterval(() => {
    while (reminderTriggers.length > 0) {
      const trigger = reminderTriggers.shift();
      res.write(`data: ${JSON.stringify(trigger)}\n\n`);
    }
    // Heartbeat
    res.write(': heartbeat\n\n');
  }, 3000);

  req.on('close', () => clearInterval(intervalId));
});

module.exports = router;

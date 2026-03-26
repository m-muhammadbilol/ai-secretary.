const ACTION_INTENT_MAP = {
  create_task: 'task_create',
  complete_task: 'task_complete',
  delete_task: 'delete_action',
  create_reminder: 'reminder_create',
  delete_reminder: 'delete_action',
  list_reminders: 'reminder_list',
  create_meeting: 'meeting_create',
  delete_meeting: 'delete_action',
  list_tasks: 'task_list',
  get_today_agenda: 'agenda_today',
  get_tomorrow_agenda: 'agenda_tomorrow',
  set_theme: 'settings',
  chat: 'general_chat',
  ask_missing_info: 'clarification_needed',
};

const WEEKDAY_MAP = {
  yakshanba: 0,
  dushanba: 1,
  seshanba: 2,
  chorshanba: 3,
  payshanba: 4,
  juma: 5,
  shanba: 6,
};

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[ʻʼ‘’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTime(hour, minute) {
  return `${pad(hour)}:${pad(minute)}`;
}

function detectAffirmative(text) {
  return /\b(ha|xo'p|xop|mayli|bo'ladi|roziman|tasdiqlayman)\b/.test(text);
}

function detectNegative(text) {
  return /\b(yo'q|yok|bekor|kerak emas|bo'lmaydi|to'xta|to'xtat)\b/.test(text);
}

function parseRepeatInterval(text) {
  const match = text.match(/har\s+(\d+)\s*(daqiqa|minut)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseTime(text, { allowBareNumber = false } = {}) {
  const explicitMatch = text.match(/\b(\d{1,2})(?::|\.| )?(\d{2})?\s*(da|ga)\b/);
  if (explicitMatch) {
    const hour = Number.parseInt(explicitMatch[1], 10);
    const minute = Number.parseInt(explicitMatch[2] || '0', 10);
    if (!Number.isNaN(hour) && !Number.isNaN(minute) && hour <= 23 && minute <= 59) {
      return { hour, minute, explicit: true };
    }
  }

  if (allowBareNumber) {
    const bareMatch = text.match(/^(\d{1,2})(?::|\.| )?(\d{2})?$/);
    if (bareMatch) {
      const hour = Number.parseInt(bareMatch[1], 10);
      const minute = Number.parseInt(bareMatch[2] || '0', 10);
      if (!Number.isNaN(hour) && !Number.isNaN(minute) && hour <= 23 && minute <= 59) {
        return { hour, minute, explicit: false };
      }
    }
  }

  return null;
}

function parseDate(text) {
  const now = new Date();

  if (/\bbugun\b/.test(text)) {
    return formatDate(now);
  }

  if (/\bertaga\b/.test(text)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return formatDate(tomorrow);
  }

  if (/\bindin\b/.test(text)) {
    const afterTomorrow = new Date(now);
    afterTomorrow.setDate(now.getDate() + 2);
    return formatDate(afterTomorrow);
  }

  for (const [weekdayName, weekdayNumber] of Object.entries(WEEKDAY_MAP)) {
    const pattern = new RegExp(`\\b${weekdayName}(\\s+kuni)?\\b`);
    if (pattern.test(text)) {
      const date = new Date(now);
      const diff = (weekdayNumber - date.getDay() + 7) % 7;
      date.setDate(date.getDate() + diff);
      return formatDate(date);
    }
  }

  return null;
}

function toTriggerAt(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const triggerAt = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(triggerAt.getTime()) ? null : triggerAt.toISOString();
}

function inferActionFromTranscript(text, fallbackAction = null) {
  if (/(meeting|yig'ilish)/.test(text)) return 'create_meeting';
  if (/(eslat|eslatma|aytib tur)/.test(text)) return 'create_reminder';
  if (/(task|vazifa|yozib qo'y)/.test(text)) return 'create_task';
  return fallbackAction;
}

function extractReminderTitle(text, actionType) {
  const cleaned = text
    .replace(/har\s+\d+\s*(daqiqa|minut)(da)?/g, '')
    .replace(/\b(\d{1,2})(?::|\.| )?(\d{2})?\s*(da|ga)\b/g, '')
    .replace(/\b(bugun|ertaga|indin|yakshanba|dushanba|seshanba|chorshanba|payshanba|juma|shanba)(\s+kuni)?\b/g, '')
    .replace(/\beslat(ma)?\b/g, '')
    .replace(/\baytib tur\b/g, '')
    .replace(/\bmeeting(im)?\b/g, '')
    .replace(/\byig'ilish(im)?\b/g, '')
    .replace(/\bbor\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned) return cleaned;
  return actionType === 'create_meeting' ? 'Meeting' : 'Eslatma';
}

function buildDraftFromTranscript(transcript, fallbackAction = null, existingDraft = {}, options = {}) {
  const normalized = normalizeText(transcript);
  const allowBareNumber = Boolean(options.allowBareNumber);
  const targetAction =
    existingDraft.targetAction ||
    inferActionFromTranscript(normalized, fallbackAction) ||
    fallbackAction ||
    'chat';
  const parsedTime = parseTime(normalized, { allowBareNumber });
  const parsedDate = parseDate(normalized);
  const repeatInterval = parseRepeatInterval(normalized);
  const draft = {
    ...existingDraft,
    targetAction,
  };

  if ((targetAction === 'create_meeting' || targetAction === 'create_reminder') && !draft.title) {
    draft.title = extractReminderTitle(normalized, targetAction);
  }

  if (parsedDate) {
    draft.date = parsedDate;
  }

  if (parsedTime) {
    draft.time = formatTime(parsedTime.hour, parsedTime.minute);
  }

  if (repeatInterval != null) {
    draft.repeatInterval = repeatInterval;
  }

  if (draft.date && draft.time) {
    draft.triggerAt = toTriggerAt(draft.date, draft.time);
  } else if (!draft.repeatInterval) {
    draft.triggerAt = null;
  }

  return draft;
}

function getMissingField(targetAction, draft = {}) {
  if (targetAction === 'create_task') {
    return draft.title ? null : 'title';
  }

  if (targetAction === 'create_meeting' || targetAction === 'create_reminder') {
    if (draft.repeatInterval != null && !draft.date && !draft.time) {
      return null;
    }
    if (!draft.date) return 'date';
    if (!draft.time) return 'time';
  }

  return null;
}

function buildFollowUpQuestion(targetAction, missingField) {
  if (missingField === 'date') {
    return targetAction === 'create_meeting'
      ? 'Qaysi kuni meeting ekanini ayting.'
      : 'Qaysi kuni eslatishimni ayting.';
  }

  if (missingField === 'time') {
    return targetAction === 'create_meeting'
      ? 'Soat nechada bo\'lishini ayting.'
      : 'Soat nechada eslatishimni ayting.';
  }

  if (missingField === 'title') {
    return 'Nima deb yozib qo\'yishimni ayting.';
  }

  return 'Bitta aniqlik kiriting.';
}

function buildSuccessMessage(targetAction, draft) {
  if (targetAction === 'create_meeting') {
    const when = draft.date && draft.time ? `${draft.date} kuni ${draft.time}` : 'belgilangan vaqtda';
    return `Xo'p, meetingni ${when} ga saqladim.`;
  }

  if (targetAction === 'create_reminder') {
    if (draft.repeatInterval != null && !draft.triggerAt) {
      return `Xo'p, "${draft.title}" uchun har ${draft.repeatInterval} daqiqada eslataman.`;
    }
    const when = draft.date && draft.time ? `${draft.date} kuni ${draft.time}` : 'belgilangan vaqtda';
    return `Xo'p, "${draft.title}" uchun ${when} eslatma qo'ydim.`;
  }

  if (targetAction === 'create_task') {
    return `"${draft.title}" vazifasini yozib qo'ydim.`;
  }

  return 'Xo\'p, bajaraman.';
}

function buildLocalAssistantResult({ replyText, actionType, data = {}, requiresConfirmation = false, confirmationTarget = null }) {
  return {
    intent: ACTION_INTENT_MAP[actionType] || 'general_chat',
    replyText,
    action: {
      type: actionType,
      data,
    },
    meta: {
      requiresConfirmation,
      confirmationTarget,
      tone: 'friendly',
      speak: true,
      playSound: false,
      soundType: null,
      showSticker: actionType !== 'ask_missing_info' && actionType !== 'chat',
      stickerType: actionType !== 'ask_missing_info' && actionType !== 'chat' ? 'success' : null,
      structuredAction: actionType,
      structuredData: data,
      localResolution: true,
    },
  };
}

function normalizeDraftData(actionType, data = {}) {
  const targetAction = data.targetAction || actionType;
  return {
    ...data,
    targetAction,
    triggerAt: data.triggerAt || toTriggerAt(data.date, data.time),
  };
}

function refineAssistantResult(transcript, result, context = {}) {
  const normalized = normalizeText(transcript);
  const actionType = result?.action?.type || 'chat';
  const actionData = result?.action?.data || {};

  if (actionType === 'ask_missing_info') {
    const targetAction =
      actionData.targetAction ||
      context.pendingInteraction?.data?.targetAction ||
      inferActionFromTranscript(normalized, context.pendingInteraction?.action || null);
    const baseDraft = normalizeDraftData(targetAction, context.pendingInteraction?.data?.draft || {});
    const draft = buildDraftFromTranscript(transcript, targetAction, baseDraft);
    const missing = actionData.missing || getMissingField(targetAction, draft) || 'time';
    return buildLocalAssistantResult({
      replyText: result.replyText || buildFollowUpQuestion(targetAction, missing),
      actionType: 'ask_missing_info',
      data: {
        targetAction,
        draft,
        missing,
      },
    });
  }

  if (actionType === 'create_meeting' || actionType === 'create_reminder') {
    const baseDraft = normalizeDraftData(actionType, actionData);
    const transcriptDraft = buildDraftFromTranscript(transcript, actionType, baseDraft);
    const missing = getMissingField(actionType, transcriptDraft);

    if (missing) {
      return buildLocalAssistantResult({
        replyText: buildFollowUpQuestion(actionType, missing),
        actionType: 'ask_missing_info',
        data: {
          targetAction: actionType,
          draft: transcriptDraft,
          missing,
        },
      });
    }

    return buildLocalAssistantResult({
      replyText: result.replyText || buildSuccessMessage(actionType, transcriptDraft),
      actionType,
      data: {
        title: transcriptDraft.title,
        notes: transcriptDraft.notes || '',
        triggerAt: transcriptDraft.triggerAt,
        repeatInterval: transcriptDraft.repeatInterval || null,
        date: transcriptDraft.date || null,
        time: transcriptDraft.time || null,
      },
    });
  }

  if (actionType === 'create_task') {
    const title = actionData.title || transcript.trim();
    if (!title) {
      return buildLocalAssistantResult({
        replyText: buildFollowUpQuestion(actionType, 'title'),
        actionType: 'ask_missing_info',
        data: {
          targetAction: actionType,
          draft: { targetAction: actionType },
          missing: 'title',
        },
      });
    }
  }

  return result;
}

function resolvePendingInteraction(transcript, context = {}) {
  const pending = context.pendingInteraction;
  if (!pending) return null;

  const normalized = normalizeText(transcript);

  if (pending.reason === 'confirmation') {
    if (detectAffirmative(normalized)) {
      const targetAction =
        pending.confirmationTarget === 'delete_reminder' || pending.confirmationTarget === 'delete_meeting'
          ? pending.confirmationTarget
          : 'delete_task';
      return buildLocalAssistantResult({
        replyText: 'Xo\'p, o\'chiraman.',
        actionType: targetAction,
        data: pending.data || {},
      });
    }

    if (detectNegative(normalized)) {
      return buildLocalAssistantResult({
        replyText: 'Mayli, bekor qildim.',
        actionType: 'chat',
        data: {},
      });
    }

    return buildLocalAssistantResult({
      replyText: 'Tasdiqlasangiz "ha", bekor qilish uchun "yo\'q" deng.',
      actionType: 'chat',
      data: {},
    });
  }

  if (pending.reason !== 'missing_info') {
    return null;
  }

  const targetAction = pending.data?.targetAction || pending.action;
  if (!targetAction) {
    return null;
  }

  const existingDraft = normalizeDraftData(targetAction, pending.data?.draft || {});
  const mergedDraft = buildDraftFromTranscript(transcript, targetAction, existingDraft, {
    allowBareNumber: pending.data?.missing === 'time',
  });

  if (pending.data?.missing === 'title' && !mergedDraft.title) {
    mergedDraft.title = transcript.trim();
  }

  const missing = getMissingField(targetAction, mergedDraft);

  if (missing) {
    return buildLocalAssistantResult({
      replyText: buildFollowUpQuestion(targetAction, missing),
      actionType: 'ask_missing_info',
      data: {
        targetAction,
        draft: mergedDraft,
        missing,
      },
    });
  }

  if (targetAction === 'create_meeting' || targetAction === 'create_reminder') {
    return buildLocalAssistantResult({
      replyText: buildSuccessMessage(targetAction, mergedDraft),
      actionType: targetAction,
      data: {
        title: mergedDraft.title,
        notes: mergedDraft.notes || '',
        triggerAt: mergedDraft.triggerAt,
        repeatInterval: mergedDraft.repeatInterval || null,
        date: mergedDraft.date || null,
        time: mergedDraft.time || null,
      },
    });
  }

  if (targetAction === 'create_task') {
    return buildLocalAssistantResult({
      replyText: buildSuccessMessage(targetAction, mergedDraft),
      actionType: targetAction,
      data: {
        title: mergedDraft.title,
        description: mergedDraft.description || '',
      },
    });
  }

  return null;
}

module.exports = {
  refineAssistantResult,
  resolvePendingInteraction,
};

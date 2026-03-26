const ORDINAL_MAP = {
  birinchi: 1,
  ikkinchi: 2,
  uchinchi: 3,
  tortinchi: 4,
  "to'rtinchi": 4,
  beshinchi: 5,
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[ʻʼ‘’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAfterKeywords(text, keywords) {
  for (const keyword of keywords) {
    const index = text.indexOf(keyword);
    if (index !== -1) {
      const remainder = text.slice(index + keyword.length).trim();
      if (remainder) {
        return remainder.replace(/^[:,-]\s*/, '').trim();
      }
    }
  }
  return '';
}

function extractTaskTitle(text) {
  return (
    extractAfterKeywords(text, [
      'yangi task qo\'sh',
      'task qo\'sh',
      'vazifa qo\'sh',
      'yozib qo\'y',
    ]) || 'Yangi vazifa'
  );
}

function extractReminderTitle(text) {
  const cleaned = text
    .replace(/har\s+\d+\s*(daqiqa|minut)(da)?/g, '')
    .replace(/\b\d{1,2}([:.]\d{2})?\s*da\b/g, '')
    .replace(/\bertaga\b/g, '')
    .replace(/\beslat(ma)?\b/g, '')
    .replace(/\bmeeting(im)?\b/g, '')
    .replace(/\byig'ilish(im)?\b/g, '')
    .replace(/\bbor\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Eslatma';
}

function parseRepeatInterval(text) {
  const match = text.match(/har\s+(\d+)\s*(daqiqa|minut)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseTime(text) {
  const match = text.match(/\b(\d{1,2})(?::|\.| )?(\d{2})?\s*da\b/);
  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2] || '0', 10);

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) {
    return null;
  }

  const now = new Date();
  if (text.includes('ertaga')) {
    now.setDate(now.getDate() + 1);
  }

  now.setHours(hour, minute, 0, 0);
  return now.toISOString();
}

function parseTaskIndex(text) {
  const ordinalMatch = text.match(
    /\b(birinchi|ikkinchi|uchinchi|tortinchi|to'rtinchi|beshinchi)\b/
  );
  if (ordinalMatch) {
    return ORDINAL_MAP[ordinalMatch[1]] || null;
  }

  const numberMatch = text.match(/\b(\d+)\b/);
  return numberMatch ? Number.parseInt(numberMatch[1], 10) : null;
}

function buildFallbackAssistantResult(transcriptText, error) {
  const normalized = normalizeText(transcriptText);
  const quotaExceeded = /quota|429|too many requests|rate limit/i.test(error?.message || '');

  if (/\b(soat|vaqt)\b/.test(normalized)) {
    return {
      intent: 'time_check',
      replyText: 'Hozirgi vaqtni aytib beraman.',
      action: { type: 'none', data: {} },
    };
  }

  if (/(bugun.*qaysi kun|bugun necha|sana|qaysi kun)/.test(normalized)) {
    return {
      intent: 'date_check',
      replyText: 'Bugungi sanani aytib beraman.',
      action: { type: 'none', data: {} },
    };
  }

  if (/(tasklarim|vazifalarim|tasklarni ko'?rsat|tasklarni korsat|vazifalarni ko'?rsat|vazifalarni korsat)/.test(normalized)) {
    return {
      intent: 'task_list',
      replyText: 'Tasklaringizni ko\'rsataman.',
      action: { type: 'list_tasks', data: {} },
    };
  }

  if (/(yangi task qo'sh|task qo'sh|vazifa qo'sh|yozib qo'y)/.test(normalized)) {
    const title = extractTaskTitle(normalized);
    return {
      intent: 'task_create',
      replyText: `"${title}" taskini qo'shdim.`,
      action: {
        type: 'create_task',
        data: { title, description: '' },
      },
    };
  }

  if (/(bajarildi|yakunla|bitdi)/.test(normalized)) {
    const index = parseTaskIndex(normalized);
    if (!index) {
      return {
        intent: 'clarification_needed',
        replyText: 'Qaysi task bajarilganini ayting.',
        action: { type: 'none', data: {} },
      };
    }

    return {
      intent: 'task_complete',
      replyText: `${index}-taskni bajarildi deb belgilayman.`,
      action: { type: 'complete_task', data: { index } },
    };
  }

  if (/(eslatmalarim|eslatmalarni ko'?rsat|eslatmalarni korsat)/.test(normalized)) {
    return {
      intent: 'reminder_list',
      replyText: 'Eslatmalaringizni ko\'rsataman.',
      action: { type: 'list_reminders', data: {} },
    };
  }

  if (/(bugungi rejalar|bugun nima qilaman|bugungi rejalarni ko'?rsat|bugungi rejalarni korsat)/.test(normalized)) {
    return {
      intent: 'agenda_today',
      replyText: 'Bugungi rejangizni ko\'rsataman.',
      action: { type: 'get_today_agenda', data: {} },
    };
  }

  if (/(ertangi rejalar|ertaga nima qilaman|ertangi rejalarni ko'?rsat|ertangi rejalarni korsat)/.test(normalized)) {
    return {
      intent: 'agenda_tomorrow',
      replyText: 'Ertangi rejangizni ko\'rsataman.',
      action: { type: 'get_tomorrow_agenda', data: {} },
    };
  }

  if (/(eslat|eslatma|meetingim bor|yig'ilishim bor)/.test(normalized)) {
    const triggerAt = parseTime(normalized);
    const repeatInterval = parseRepeatInterval(normalized);
    const title = extractReminderTitle(normalized);

    if (!triggerAt && !repeatInterval) {
      return {
        intent: 'clarification_needed',
        replyText: 'Eslatma vaqtini ham ayting. Masalan: ertaga 8 da eslat.',
        action: { type: 'none', data: {} },
      };
    }

    return {
      intent: normalized.includes('meeting') || normalized.includes('yig\'ilish')
        ? 'meeting_create'
        : 'reminder_create',
      replyText: `"${title}" uchun eslatma qo'ydim.`,
      action: {
        type:
          normalized.includes('meeting') || normalized.includes('yig\'ilish')
            ? 'create_meeting'
            : 'create_reminder',
        data: {
          title,
          triggerAt,
          repeatInterval,
          notes: '',
        },
      },
    };
  }

  if (quotaExceeded) {
    return {
      intent: 'general_chat',
      replyText:
        'Gemini limiti tugagan. Hozircha vaqt, sana, task va eslatma buyruqlarini lokal rejimda bajaraman.',
      action: { type: 'none', data: {} },
    };
  }

  return {
    intent: 'general_chat',
    replyText: 'Buyruqni tushundim, lekin hozir soddalashtirilgan rejimda ishlayapman.',
    action: { type: 'none', data: {} },
  };
}

module.exports = { buildFallbackAssistantResult };

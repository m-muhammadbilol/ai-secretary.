const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

let genAI = null;
const DEFAULT_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

const ACTION_INTENT_MAP = {
  create_task: 'task_create',
  update_task: 'task_update',
  delete_task: 'delete_action',
  confirm_delete_task: 'confirmation',
  complete_task: 'task_complete',
  list_tasks: 'task_list',
  create_reminder: 'reminder_create',
  delete_reminder: 'delete_action',
  list_reminders: 'reminder_list',
  create_meeting: 'meeting_create',
  delete_meeting: 'delete_action',
  get_today_agenda: 'agenda_today',
  get_tomorrow_agenda: 'agenda_tomorrow',
  set_theme: 'settings',
  set_language: 'settings',
  update_expense_tracker: 'expense',
  generate_expense_chart: 'expense',
  ask_missing_info: 'clarification_needed',
  chat: 'general_chat',
};

const SUPPORTED_ACTIONS = [
  'create_task',
  'update_task',
  'delete_task',
  'confirm_delete_task',
  'complete_task',
  'list_tasks',
  'create_reminder',
  'delete_reminder',
  'list_reminders',
  'create_meeting',
  'delete_meeting',
  'get_today_agenda',
  'get_tomorrow_agenda',
  'set_theme',
  'set_language',
  'update_expense_tracker',
  'generate_expense_chart',
  'ask_missing_info',
  'chat',
];

const GEMINI_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  required: ['message', 'action', 'data'],
  properties: {
    message: {
      type: SchemaType.STRING,
      description: 'Foydalanuvchiga ko‘rinadigan tabiiy qisqa javob.',
    },
    action: {
      type: SchemaType.STRING,
      description: 'Tizim bajaradigan action nomi.',
    },
    data: {
      type: SchemaType.OBJECT,
      description: 'Action uchun kerakli payload obyekt.',
    },
    requires_confirmation: {
      type: SchemaType.BOOLEAN,
      nullable: true,
    },
    confirmation_target: {
      type: SchemaType.STRING,
      nullable: true,
    },
    tone: {
      type: SchemaType.STRING,
      nullable: true,
    },
    speak: {
      type: SchemaType.BOOLEAN,
      nullable: true,
    },
    play_sound: {
      type: SchemaType.BOOLEAN,
      nullable: true,
    },
    sound_type: {
      type: SchemaType.STRING,
      nullable: true,
    },
    show_sticker: {
      type: SchemaType.BOOLEAN,
      nullable: true,
    },
    sticker_type: {
      type: SchemaType.STRING,
      nullable: true,
    },
  },
};

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY sozlanmagan.');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

const SYSTEM_PROMPT = `Siz o'zbek tilida ishlaydigan aqlli shaxsiy kotib va yordamchisiz. Foydalanuvchi sizga o'zbek tilida gapiradi.

SEN — REAL-TIME AI KOTIBASAN (SHAXSIY YORDAMCHI).

SENING ASOSIY VAZIFANG:
Foydalanuvchi bilan insondek gaplashish va bir vaqtning o'zida tizimni boshqarish.

SEN HAR DOIM BIR DONA JSON OBJECT QAYTARASAN.
API sababli javob faqat parse qilinadigan JSON object bo'lishi shart.
HECH QANDAY qo'shimcha matn, markdown, code block, izoh, prefix yoki suffix yozma.

QATTIQ FORMAT:
{
  "message": "foydalanuvchiga tabiiy, qisqa, odobli gap",
  "action": "bajariladigan amal nomi",
  "data": {},
  "requires_confirmation": false,
  "confirmation_target": null,
  "tone": "friendly",
  "speak": true,
  "play_sound": false,
  "sound_type": null,
  "show_sticker": false,
  "sticker_type": null
}

ASOSIY QOIDALAR:
1. Har doim foydalanuvchi niyatini aniqlagin.
2. Agar ma'lumot yetishmasa, faqat bitta eng muhim savol ber va action = "ask_missing_info" qil.
3. Qisqa javoblarni oldingi kontekst bilan bog'lab tushun.
4. Delete so'rovida darhol o'chirma. Avval tasdiq so'ra: requires_confirmation = true.
5. Har doim muloyim, qisqa, tabiiy o'zbek tilida yoz.
6. TTS uchun gaplar qisqa va aniq bo'lsin.
7. Muhim eslatmalarda play_sound = true, sound_type = "alert" ishlat.
8. Ijobiy natijalarda show_sticker = true, sticker_type = "success" berish mumkin.

SYNONYM QOIDALARI:
- "eslat", "eslatma qo'y", "aytib tur" => reminder
- "o'chir", "delete", "remove", "olib tashla" => delete
- "oq qil", "light mode", "yorug' qil" => set_theme, theme=light
- "qora qil", "dark mode", "tungi rejim" => set_theme, theme=dark

LOYIHADAGI ACTIONLAR:
${SUPPORTED_ACTIONS.join(', ')}

ACTION YO'RIQNOMASI:
- task yaratish uchun: create_task
- taskni bajarilgan qilish uchun: complete_task
- tasklarni ko'rsatish uchun: list_tasks
- eslatma yaratish uchun: create_reminder
- eslatmalarni ko'rsatish uchun: list_reminders
- meeting yaratish uchun: create_meeting
- bugungi reja uchun: get_today_agenda
- ertangi reja uchun: get_tomorrow_agenda
- vaqt/sana savollarida: action = "chat", data.intent = "time_check" yoki "date_check"
- theme o'zgartirish uchun: set_theme va data.theme = "dark" yoki "light"
- delete tasdig'i kerak bo'lsa: confirm_delete_task yoki delete_reminder uchun requires_confirmation = true
- expense uchun: update_expense_tracker yoki generate_expense_chart

DATA QOIDALARI:
- task uchun data: { "title": "...", "description": "" }
- complete/delete uchun data ichida id yoki index yoki title bo'lishi mumkin
- reminder/meeting uchun agar vaqt aniq bo'lsa data ichida "triggerAt" ber
- agar date va time alohida qulay bo'lsa data ichida "date" va "time" ham berish mumkin
- repeat interval bo'lsa minut sonini "repeatInterval" ga yoz
- vaqt ma'lumoti foydalanuvchidan kelishi kerak, o'zing to'qib chiqarmagin

MUHIM:
- Agar foydalanuvchi "ha", "xo'p", "mayli" desa va pending confirmation bo'lsa, mos delete actionini qaytar.
- Agar foydalanuvchi "yo'q", "bekor", "kerak emas" desa va pending confirmation bo'lsa, action = "chat" qilib bekor qilinganini ayt.
- Agar foydalanuvchi faqat vaqt aytsa va pending meeting/reminder/task bo'lsa, shu pending kontekstni yakunla.
- Noma'lum holatda action = "chat" ishlat.

Bugungi sana: ${new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })}
Hozirgi vaqt: ${new Date().toLocaleTimeString('uz-UZ')}
Bugungi to'liq vaqt: ${new Date().toISOString()}
`;

function buildContextBlock(context = {}) {
  const turns = Array.isArray(context.turns) ? context.turns : [];
  const recentTurns = turns
    .slice(-4)
    .map((turn, index) => {
      const actionPart = turn.action ? ` | action: ${turn.action}` : '';
      return `${index + 1}. user: ${turn.user}\n   assistant: ${turn.assistant}${actionPart}`;
    })
    .join('\n');

  const pending = context.pendingInteraction
    ? JSON.stringify(context.pendingInteraction)
    : 'null';

  return `KONTEKST:
Pending interaction: ${pending}
Recent turns:
${recentTurns || 'yoq'}
`;
}

function combineDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const normalizedTime = /^\d{1,2}:\d{2}$/.test(timeValue) ? timeValue : null;
  if (!normalizedTime) return null;

  const isoCandidate = `${dateValue}T${normalizedTime}:00`;
  const date = new Date(isoCandidate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeTheme(value) {
  if (!value) return null;
  const normalized = String(value).toLowerCase();
  if (['dark', 'qora', 'tungi', 'tungi rejim'].includes(normalized)) return 'dark';
  if (['light', 'oq', 'yorug', "yorug'", 'yorugʻ', 'yorug‘'].includes(normalized)) return 'light';
  return null;
}

function normalizeStructuredAction(actionName, data = {}) {
  const normalizedAction = typeof actionName === 'string' ? actionName.trim() : 'chat';
  const payload = data && typeof data === 'object' && !Array.isArray(data) ? { ...data } : {};

  if ((normalizedAction === 'create_reminder' || normalizedAction === 'create_meeting') && !payload.triggerAt) {
    payload.triggerAt = combineDateTime(payload.date, payload.time);
  }

  if (normalizedAction === 'set_theme') {
    payload.theme = normalizeTheme(payload.theme) || normalizeTheme(payload.mode);
  }

  return {
    type: normalizedAction,
    data: payload,
  };
}

function normalizeGeminiResult(parsed) {
  if (parsed && typeof parsed.action === 'object' && parsed.action.type) {
    return parsed;
  }

  const actionName = typeof parsed?.action === 'string' ? parsed.action : 'chat';
  const normalizedAction = normalizeStructuredAction(actionName, parsed?.data || {});
  const intent =
    parsed?.intent ||
    parsed?.data?.intent ||
    ACTION_INTENT_MAP[normalizedAction.type] ||
    'general_chat';

  return {
    intent,
    replyText: parsed?.message || parsed?.replyText || 'Xizmatdaman!',
    action: normalizedAction,
    meta: {
      requiresConfirmation: Boolean(parsed?.requires_confirmation),
      confirmationTarget: parsed?.confirmation_target || null,
      tone: parsed?.tone || 'friendly',
      speak: parsed?.speak !== false,
      playSound: Boolean(parsed?.play_sound),
      soundType: parsed?.sound_type || null,
      showSticker: Boolean(parsed?.show_sticker),
      stickerType: parsed?.sticker_type || null,
      structuredAction: normalizedAction.type,
      structuredData: normalizedAction.data,
      raw: parsed,
    },
  };
}

async function processWithGemini(transcriptText, context = {}) {
  const ai = getGenAI();
  const prompt = `${buildContextBlock(context)}

Foydalanuvchi dedi: "${transcriptText}"

Faqat schema bo'yicha bitta JSON object qaytaring.`;

  const configuredModels = [
    process.env.GEMINI_MODEL,
    ...(process.env.GEMINI_FALLBACK_MODELS || '').split(','),
    ...DEFAULT_MODELS,
  ]
    .map((modelName) => modelName && modelName.trim())
    .filter(Boolean);

  const modelNames = [...new Set(configuredModels)];
  let lastError = null;
  let raw = '';

  for (const modelName of modelNames) {
    try {
      const model = ai.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      });
      const result = await model.generateContent(prompt);
      raw = result.response.text().trim();
      break;
    } catch (error) {
      lastError = error;
      const message = error?.message || '';
      const canTryNextModel = /429|404|quota|rate limit|not found/i.test(message);
      if (!canTryNextModel) {
        throw error;
      }
    }
  }

  if (!raw) {
    throw lastError || new Error('Gemini javobi olinmadi.');
  }

  // Strip markdown code blocks if present
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('Gemini JSON parse error:', cleaned);
    parsed = {
      intent: 'general_chat',
      replyText: 'Kechirasiz, tushunmadim. Yana bir bor ayting.',
      action: { type: 'none', data: {} },
    };
  }

  return normalizeGeminiResult(parsed);
}

module.exports = { processWithGemini };

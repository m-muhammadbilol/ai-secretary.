# 🤖 Kotib AI — O'zbek AI Shaxsiy Kotib

Smartphone-first O'zbek tilida ishlovchi AI shaxsiy kotib ilovasi.

## Texnologiyalar

| Layer | Stack |
|-------|-------|
| Frontend | React 18 + Vite + JSX |
| Backend | Node.js + Express |
| AI Brain | Google Gemini 2.5 Flash |
| STT/TTS | UzbekVoiceAI |
| Routing | React Router v6 |

## Loyiha tuzilmasi

```
ai-secretary/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── pages/         # HomePage, TasksPage, SettingsPage
│   │   ├── components/    # MicButton, BottomNav, Cards...
│   │   ├── hooks/         # useAudioRecorder, useAudioPlayer, useNotifications
│   │   ├── services/      # api.js
│   │   ├── context/       # AppContext
│   │   └── App.jsx
│   ├── vite.config.js
│   └── vercel.json
└── backend/               # Node.js + Express
    ├── routes/            # stt, tts, assistant, tasks, reminders, health
    ├── services/          # store, sttService, ttsService, geminiService, schedulerService
    ├── server.js
    └── vercel.json
```

## O'rnatish

### Tez ishga tushirish

```bash
npm install --prefix backend
npm install --prefix frontend

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# backend/.env va frontend/.env fayllarini to'ldiring
npm run dev
```

Bu buyruq backend va frontend dev serverlarini birga ishga tushiradi.

### Alohida ishga tushirish

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## .env sozlamalari (backend)

```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
UZBEKVOICEAI_API_KEY=your_uzbekvoiceai_key
UZBEKVOICEAI_STT_URL=https://uzbekvoice.ai/api/v1/stt
UZBEKVOICEAI_TTS_URL=https://uzbekvoice.ai/api/v1/tts
UZBEKVOICEAI_TTS_MODEL=lola
FRONTEND_URL=http://localhost:5173
```

## API kalitlarini olish

- **Gemini**: https://aistudio.google.com/app/apikey
- **UzbekVoiceAI**: https://uzbekvoice.ai (ro'yxatdan o'ting)

## Ovoz pipeline

```
Foydalanuvchi gapiradi
→ Audio yozib olinadi
→ /api/stt → UzbekVoiceAI STT → matn
→ /api/assistant → Gemini → javob + amal
→ Amal bajariladi (task/reminder yaratish)
→ /api/tts → UzbekVoiceAI TTS → audio
→ Audio avtomatik ijro etiladi
```

## Imkoniyatlar

| Funksiya | Misol |
|----------|-------|
| Vaqt so'rash | "Soat nechchi?" |
| Sana so'rash | "Bugun qaysi kun?" |
| Task yaratish | "Yangi task qo'sh: Loyihani tugatish" |
| Tasklar ro'yxati | "Tasklarimni ko'rsat" |
| Eslatma | "2 soatdan keyin suv ichishni eslat" |
| Takroriy eslatma | "3 da meetingim bor, har 5 minutda eslat" |
| Kun rejasi | "Bugungi rejalarimni ko'rsat" |
| Ertangi reja | "Ertaga nima qilaman?" |

## Vercel Deploy

### Backend
```bash
cd backend
vercel --prod
# Environment Variables ni Vercel dashboard'da sozlang
```

### Frontend
```bash
cd frontend
# .env da VITE_API_URL=https://your-backend.vercel.app
vercel --prod
```

## Test stsenariylari

1. **Vaqt**: "Soat nechchi?" → vaqt javob beradi
2. **Task**: "Yangi task qo'sh: React loyiha" → task yaratiladi, Tasks sahifasida ko'rinadi
3. **Takroriy eslatma**: "3 da meetingim bor, har 5 minutda eslat" → 5 daqiqada bir browser notification
4. **Kun rejasi**: "Bugungi rejalarimni ko'rsat" → barcha task va eslatmalar ko'rinadi
5. **Task bajarish**: "Birinchi taskni bajarildi deb belgilagin" → checkbox yoqiladi

## Xatolar va yechimlar

| Xato | Yechim |
|------|--------|
| Mikrofonga ruxsat yo'q | Settings → Ruxsat bering |
| STT ishlamayapti | UZBEKVOICEAI_API_KEY tekshiring |
| Gemini xatosi | GEMINI_API_KEY tekshiring |
| TTS audio chiqmayapti | Brauzer autoplay policy — foydalanuvchi avval tap qilishi kerak |
| CORS xatosi | FRONTEND_URL ni backend .env da tekshiring |

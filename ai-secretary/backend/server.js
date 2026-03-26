require('dotenv').config();
const express = require('express');
const cors = require('cors');

const sttRoute = require('./routes/stt');
const ttsRoute = require('./routes/tts');
const assistantRoute = require('./routes/assistant');
const tasksRoute = require('./routes/tasks');
const remindersRoute = require('./routes/reminders');
const healthRoute = require('./routes/health');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  /^https?:\/\/localhost:517\d$/,
  /^https?:\/\/127\.0\.0\.1:517\d$/,
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/stt', sttRoute);
app.use('/api/tts', ttsRoute);
app.use('/api/assistant', assistantRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/reminders', remindersRoute);
app.use('/api/health', healthRoute);

app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ error: 'Server xatosi yuz berdi.', detail: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ AI Secretary backend running on port ${PORT}`);
});

module.exports = app;

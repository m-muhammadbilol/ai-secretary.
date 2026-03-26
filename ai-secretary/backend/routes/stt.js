const express = require('express');
const multer = require('multer');
const { transcribeAudio } = require('../services/sttService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio fayl topilmadi.' });
    }

    const audioBuffer = req.file.buffer;
    const mimeType = req.file.mimetype || 'audio/webm';

    const transcript = await transcribeAudio(audioBuffer, mimeType);

    if (!transcript || transcript.trim().length === 0) {
      return res.json({
        transcript: '',
        message: 'Nutq aniqlanmadi. Iltimos, qayta urinib ko\'ring.',
      });
    }

    res.json({ transcript: transcript.trim() });
  } catch (err) {
    console.error('STT error:', err.message);
    res.status(500).json({
      error: 'Nutqni matnga o\'girish muvaffaqiyatsiz bo\'ldi.',
      detail: err.message,
    });
  }
});

module.exports = router;

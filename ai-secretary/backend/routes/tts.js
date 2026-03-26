const express = require('express');
const { synthesizeSpeech } = require('../services/ttsService');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Matn bo\'sh.' });
    }

    const audioBuffer = await synthesizeSpeech(text.trim());

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache',
    });

    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({
      error: 'Ovozga o\'girish muvaffaqiyatsiz bo\'ldi.',
      detail: err.message,
    });
  }
});

module.exports = router;

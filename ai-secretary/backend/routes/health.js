const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      gemini: !!process.env.GEMINI_API_KEY,
      uzbekVoiceAI: !!process.env.UZBEKVOICEAI_API_KEY,
    },
  });
});

module.exports = router;

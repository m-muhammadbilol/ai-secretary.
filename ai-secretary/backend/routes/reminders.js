const express = require('express');
const { getReminders, createReminder, deactivateReminder } = require('../services/store');
const { scheduleReminder, cancelScheduledReminder } = require('../services/schedulerService');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ reminders: getReminders() });
});

router.post('/', (req, res) => {
  const { title, triggerAt, repeatInterval, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Sarlavha kerak.' });

  const reminder = createReminder({ title, triggerAt, repeatInterval, notes });

  scheduleReminder(reminder, (r) => {
    console.log(`⏰ Reminder triggered: ${r.title}`);
  });

  res.json({ reminder });
});

router.patch('/:id/deactivate', (req, res) => {
  cancelScheduledReminder(req.params.id);
  const reminder = deactivateReminder(req.params.id);
  if (!reminder) return res.status(404).json({ error: 'Eslatma topilmadi.' });
  res.json({ reminder });
});

module.exports = router;

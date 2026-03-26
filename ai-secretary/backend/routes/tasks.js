const express = require('express');
const { getTasks, createTask, completeTaskById, deleteTask } = require('../services/store');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ tasks: getTasks() });
});

router.post('/', (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Sarlavha kerak.' });
  const task = createTask(title, description || '');
  res.json({ task });
});

router.patch('/:id/complete', (req, res) => {
  const task = completeTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task topilmadi.' });
  res.json({ task });
});

router.delete('/:id', (req, res) => {
  const task = deleteTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task topilmadi.' });
  res.json({ deleted: true, task });
});

module.exports = router;

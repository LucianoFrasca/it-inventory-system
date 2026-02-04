const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// Obtener todos los logs (ordenados por fecha descendente)
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find().sort({ fecha: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
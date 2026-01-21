const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');

// Obtener todos los activos
router.get('/', async (req, res) => {
    try {
        const assets = await Asset.find().populate('tipo').populate('usuarioAsignado');
        res.json(assets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Registrar nuevo activo
router.post('/', async (req, res) => {
    const asset = new Asset(req.body);
    try {
        const newAsset = await asset.save();
        res.status(201).json(newAsset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
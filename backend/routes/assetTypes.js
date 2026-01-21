const express = require('express');
const router = express.Router();
const AssetType = require('../models/AssetType');

// 1. Obtener todos los tipos de activos
router.get('/', async (req, res) => {
    try {
        const types = await AssetType.find();
        res.json(types);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Crear un nuevo tipo (Ej: "Laptop" con campos específicos)
router.post('/', async (req, res) => {
    const assetType = new AssetType({
        nombre: req.body.nombre,
        campos: req.body.campos // Aquí recibimos el array de campos dinámicos
    });
    try {
        const newType = await assetType.save();
        res.status(201).json(newType);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
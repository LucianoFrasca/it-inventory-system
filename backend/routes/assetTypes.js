const express = require('express');
const router = express.Router();
const AssetType = require('../models/AssetType');

// 1. OBTENER TODOS LOS TIPOS
router.get('/', async (req, res) => {
    try {
        const types = await AssetType.find();
        res.json(types);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. CREAR NUEVO TIPO
router.post('/', async (req, res) => {
    const { nombre, campos } = req.body;
    
    // Validación básica
    if (!nombre) {
        return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const type = new AssetType({
        nombre,
        campos: campos || [] // Si no vienen campos, array vacío
    });

    try {
        const newType = await type.save();
        res.status(201).json(newType);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. EDITAR TIPO (Agregar/Quitar campos o cambiar nombre)
router.put('/:id', async (req, res) => {
    try {
        const { nombre, campos } = req.body;
        
        // Buscamos y actualizamos
        const updatedType = await AssetType.findByIdAndUpdate(
            req.params.id,
            { 
                nombre, 
                campos // Mongoose se encarga de actualizar el array de subdocumentos
            },
            { new: true } // Para que devuelva el objeto ya actualizado
        );

        if (!updatedType) {
            return res.status(404).json({ message: "Tipo de activo no encontrado" });
        }

        res.json(updatedType);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 4. ELIMINAR TIPO
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await AssetType.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: "No encontrado" });
        }
        res.json({ message: 'Tipo de activo eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
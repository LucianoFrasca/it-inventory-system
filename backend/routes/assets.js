const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');

// 1. OBTENER TODOS (Con datos de Tipo y Usuario populados)
router.get('/', async (req, res) => {
    try {
        const assets = await Asset.find()
            .populate('tipo')
            .populate('usuarioAsignado'); // ¡Importante para ver nombres en la tabla!
        res.json(assets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. CREAR
router.post('/', async (req, res) => {
    const asset = new Asset(req.body);
    try {
        const newAsset = await asset.save();
        res.status(201).json(newAsset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. EDITAR (PUT) - ¡NUEVO!
router.put('/:id', async (req, res) => {
    try {
        const updatedAsset = await Asset.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Devolver el objeto actualizado
        );
        res.json(updatedAsset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// 4. BORRADO MASIVO (Bulk Delete)
// Debe ir ANTES de router.delete('/:id') para que no confunda "bulk-delete" con un ID
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body; // Esperamos un array de IDs: ["id1", "id2"]
        
        if (!ids || ids.length === 0) {
            return res.status(400).json({ message: "No se enviaron IDs para eliminar" });
        }

        // Borramos todos los que coincidan con la lista
        await Asset.deleteMany({
            _id: { $in: ids }
        });

        res.json({ message: `${ids.length} activos eliminados correctamente` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. ELIMINAR
router.delete('/:id', async (req, res) => {
    try {
        await Asset.findByIdAndDelete(req.params.id);
        res.json({ message: 'Activo eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
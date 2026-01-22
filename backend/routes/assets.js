const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const User = require('../models/User'); // Necesitamos buscar usuarios

router.post('/bulk-import', async (req, res) => {
    const { tipoId, activos } = req.body;
    let creados = 0;
    let errores = 0;
    let detalles = [];

    for (const [index, data] of activos.entries()) {
        try {
            // 1. Lógica de Usuario: Buscar por Email si viene en el Excel
            let usuarioId = null;
            if (data.emailUsuario) {
                const emailLimpio = String(data.emailUsuario).trim().toLowerCase();
                const usuarioEncontrado = await User.findOne({ email: emailLimpio });
                if (usuarioEncontrado) {
                    usuarioId = usuarioEncontrado._id;
                } else {
                    detalles.push(`Fila ${index + 1}: Usuario ${emailLimpio} no encontrado. Se cargó como 'Sin Asignar'.`);
                }
            }

            // 2. Separar datos fijos de detalles técnicos dinámicos
            const { marca, modelo, serialNumber, estado, emailUsuario, ...camposExtra } = data;

            const nuevoActivo = new Asset({
                tipo: tipoId,
                marca: marca || 'Genérica',
                modelo: modelo || 'Desconocido',
                serialNumber: String(serialNumber).trim(),
                estado: usuarioId ? 'Asignado' : (estado || 'Disponible'),
                usuarioAsignado: usuarioId,
                detallesTecnicos: camposExtra // Todo lo que no es fijo va al Map
            });

            await nuevoActivo.save();
            creados++;
        } catch (error) {
            errores++;
            detalles.push(`Error en fila ${index + 1}: ${error.message}`);
        }
    }

    res.json({
        message: `Importación finalizada. ✅ ${creados} creados. ❌ ${errores} errores.`,
        detalles
    });
});

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
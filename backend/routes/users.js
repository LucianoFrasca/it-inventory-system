const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1. Obtener todos los usuarios (para la tabla con filtros)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().populate('activosAsignados');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Obtener un usuario específico por ID (para ver su perfil detallado)
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('activosAsignados');
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Crear un usuario manualmente
router.post('/', async (req, res) => {
    const user = new User({
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        email: req.body.email,
        tipo: req.body.tipo, // 'Administrador' o 'Estandar'
        password: req.body.password // Solo si es Admin
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 4. Ruta para Importación Masiva (Estructura inicial)
// Aquí recibiremos el array de objetos desde el Excel/CSV procesado en el front
router.post('/bulk', async (req, res) => {
    try {
        const users = req.body; // Array de usuarios
        const savedUsers = await User.insertMany(users);
        res.status(201).json(savedUsers);
    } catch (err) {
        res.status(400).json({ message: "Error en la carga masiva: " + err.message });
    }
});

module.exports = router;
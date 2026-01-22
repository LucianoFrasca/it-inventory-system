const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar usuario
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        // 2. Verificar que sea Administrador (Seguridad extra)
        if (user.rol !== 'Administrador') {
            return res.status(403).json({ message: "Acceso denegado. Solo administradores." });
        }

        // 3. Comparar contraseña (La que envías vs la encriptada)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

        // 4. Generar Token (JWT)
        // Usamos una palabra secreta temporal 'secreto_super_seguro'
        const token = jwt.sign(
            { id: user._id, rol: user.rol }, 
            process.env.JWT_SECRET || 'secreto_super_seguro', 
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
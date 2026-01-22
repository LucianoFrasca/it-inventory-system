const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); // <--- Importante

// Configuración del transporte de Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función auxiliar para generar password aleatoria
const generarPassword = () => Math.random().toString(36).slice(-8);

// 1. OBTENER TODOS
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. CREAR USUARIO MANUAL (Con envío de Email)
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, email, rol, cargo, area, departamento } = req.body;

        // Validar si existe
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: "El usuario ya existe" });

        // Generar contraseña temporal
        const tempPassword = generarPassword();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        const newUser = new User({
            nombre, apellido, email,
            rol: rol || 'Estandar',
            cargo, area, departamento,
            password: hashedPassword,
            activosAsignados: []
        });

        await newUser.save();

        // Enviar correo (Intentar, pero no bloquear si falla)
        try {
            await transporter.sendMail({
                from: `"InventorySoft Admin" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Bienvenido a InventorySoft - Credenciales de Acceso',
                html: `
                    <h1>Bienvenido, ${nombre}!</h1>
                    <p>Se ha creado tu cuenta en el sistema de inventario.</p>
                    <p><b>Usuario:</b> ${email}</p>
                    <p><b>Contraseña Temporal:</b> ${tempPassword}</p>
                    <br/>
                    <p>Por favor, ingresa y cambia tu contraseña lo antes posible.</p>
                `
            });
            console.log(`📧 Email enviado a ${email}`);
        } catch (emailError) {
            console.error("❌ Error enviando email:", emailError);
            // Si falla el mail, devolvemos la pass en la respuesta para que el admin la anote
            return res.status(201).json({ 
                message: "Usuario creado, pero falló el envío de email via SMTP.", 
                tempPassword: tempPassword, // Solo visible si falla el email
                user: newUser 
            });
        }

        res.status(201).json({ message: "Usuario creado y notificación enviada.", user: newUser });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. EDITAR USUARIO (PUT)
router.put('/:id', async (req, res) => {
    try {
        // No permitimos cambiar password ni email por esta ruta simple
        const { nombre, apellido, rol, cargo, area, departamento } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { nombre, apellido, rol, cargo, area, departamento },
            { new: true }
        );
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 4. IMPORTACIÓN MASIVA (Se mantiene igual, resumida aquí)
router.post('/bulk-import', async (req, res) => {
    // ... (Mantén el código de importación que ya tenías funcionando) ...
    // Si necesitas que te lo vuelva a pegar completo avísame, pero es el mismo de antes.
    // Solo recuerda agregar el require('nodemailer') arriba.
    const usuariosImportados = req.body;
    let creados = 0, errores = 0, detalles = [];
    const salt = await bcrypt.genSalt(10);
    const pass = await bcrypt.hash("ItSoft2024", salt);

    for (const u of usuariosImportados) {
        try {
            if(!u.email) continue;
            const existe = await User.findOne({ email: u.email });
            if (!existe) {
                await new User({
                    nombre: u.nombre, apellido: u.apellido || '', email: u.email,
                    rol: u.rol === 'Administrador' ? 'Administrador' : 'Estandar',
                    cargo: u.cargo, area: u.area, departamento: u.departamento,
                    password: pass, activosAsignados: []
                }).save();
                creados++;
            } else { errores++; detalles.push(`${u.email} ya existe`); }
        } catch (e) { errores++; detalles.push(e.message); }
    }
    res.json({ message: `Importados: ${creados}. Errores: ${errores}`, detalles });
});

// 5. BORRADO INDIVIDUAL
router.delete('/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Eliminado' });
});

// 6. BORRADO MASIVO
router.post('/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    await User.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Usuarios eliminados' });
});

module.exports = router;
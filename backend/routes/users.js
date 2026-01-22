const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Configuración de Email (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

// 2. CREAR USUARIO (Lógica corregida: Email solo a Admins)
router.post('/', async (req, res) => {
    try {
        const { nombre, apellido, email, rol, cargo, area, departamento } = req.body;

        // Validar duplicados
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ message: "El usuario ya existe" });

        // Generamos contraseña (obligatoria para Mongo)
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

        // --- LÓGICA DE EMAIL CONDICIONAL ---
        let mensajeRespuesta = "Usuario Estandar creado correctamente (sin acceso al sistema).";

        // SOLO enviamos mail si es ADMINISTRADOR
        if (rol === 'Administrador') {
            try {
                await transporter.sendMail({
                    from: `"InventorySoft Admin" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Acceso Administrativo - InventorySoft',
                    html: `
                        <h1>Bienvenido al Panel de Administración</h1>
                        <p>Hola ${nombre}, se te ha otorgado acceso administrativo.</p>
                        <p><b>Usuario:</b> ${email}</p>
                        <p><b>Contraseña Temporal:</b> ${tempPassword}</p>
                        <hr/>
                        <p>Ingresa en: <a href="http://localhost:5173">InventorySoft Login</a></p>
                    `
                });
                console.log(`📧 Email enviado a Admin: ${email}`);
                mensajeRespuesta = "Administrador creado y credenciales enviadas por email.";
            } catch (emailError) {
                console.error("❌ Error enviando email:", emailError);
                // Si falla, devolvemos la pass en el JSON para que no te quedes trabado
                return res.status(201).json({ 
                    message: "Admin creado, pero falló el envío de email.", 
                    tempPassword: tempPassword, 
                    user: newUser 
                });
            }
        }

        res.status(201).json({ message: mensajeRespuesta, user: newUser });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. EDITAR (PUT)
router.put('/:id', async (req, res) => {
    try {
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

// 4. IMPORTACIÓN MASIVA
router.post('/bulk-import', async (req, res) => {
    const usuariosImportados = req.body;
    let creados = 0, errores = 0, detalles = [];
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("ItSoft2024", salt);

    for (const [index, usuario] of usuariosImportados.entries()) {
        try {
            const email = usuario.email ? String(usuario.email).trim().toLowerCase() : '';
            if (!email || !email.includes('@')) throw new Error(`Email inválido`);

            const existe = await User.findOne({ email });
            
            if (!existe) {
                await new User({
                    nombre: usuario.nombre,
                    apellido: usuario.apellido || '',
                    email: email,
                    rol: usuario.rol === 'Administrador' ? 'Administrador' : 'Estandar',
                    cargo: usuario.cargo || '',
                    area: usuario.area || '',
                    departamento: usuario.departamento || '',
                    password: defaultPassword, // Pass genérica, total no entran
                    activosAsignados: []
                }).save();
                creados++;
            } else {
                errores++;
                detalles.push(`Fila ${index+1}: ${email} ya existe`);
            }
        } catch (error) {
            errores++;
            detalles.push(`Error fila ${index+1}: ${error.message}`);
        }
    }

    res.json({ message: `Importación: ${creados} nuevos, ${errores} errores.`, detalles });
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
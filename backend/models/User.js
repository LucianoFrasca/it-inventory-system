const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: {
        type: String,
        enum: ['Administrador', 'Estandar'],
        default: 'Estandar'
    },
    // 👇 CAMPOS DE INFORMACIÓN EXTRA 👇
    cargo: { type: String, default: '' },       
    departamento: { type: String, default: '' }, 
    area: { type: String, default: '' }, // <--- NUEVO CAMPO AREA
    // ---------------------------------
    activosAsignados: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
    }],
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
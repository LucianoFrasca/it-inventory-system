const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    tipo: { 
        type: String, 
        enum: ['Administrador', 'Estandar'], 
        default: 'Estandar' 
    },
    // Solo los admin usarán password para entrar al sistema
    password: { type: String }, 
    activosAsignados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
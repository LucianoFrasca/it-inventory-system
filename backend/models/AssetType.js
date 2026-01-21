const mongoose = require('mongoose');

const AssetTypeSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true }, // Ej: "Laptop"
  campos: [{
    nombreCampo: String, // Ej: "Sistema Operativo" [cite: 2]
    tipoDato: { type: String, enum: ['text', 'number', 'boolean'] },
    esRequerido: { type: Boolean, default: false }
  }]
});

module.exports = mongoose.model('AssetType', AssetTypeSchema);
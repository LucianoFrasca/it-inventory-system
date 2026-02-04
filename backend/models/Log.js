const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  accion: { type: String, required: true }, // Ej: "Asignación", "Devolución", "Baja"
  activo: { type: String, required: true }, // Nombre del activo "Dell Latitude..."
  serial: { type: String }, 
  usuario: { type: String, default: 'Sistema' }, 
  detalles: { type: String },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
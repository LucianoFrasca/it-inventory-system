const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  // Referencia al tipo de activo (Laptop, Monitor, etc.) 
  tipo: { type: mongoose.Schema.Types.ObjectId, ref: 'AssetType', required: true },
  
  // Campos base obligatorios para cualquier equipo
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  serialNumber: { type: String, unique: true, required: true },
  
  // Estado del activo para controlar el stock [cite: 2]
  estado: { 
    type: String, 
    enum: ['Disponible', 'Asignado', 'Reparación'], 
    default: 'Disponible' 
  },
  
  // Relación con el usuario [cite: 6, 7]
  usuarioAsignado: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  
  // Aquí se guardan los campos dinámicos definidos en el AssetType (ej: RAM, SO, Intune) [cite: 2]
  detallesTecnicos: { type: Map, of: String },
  
  fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', assetSchema);
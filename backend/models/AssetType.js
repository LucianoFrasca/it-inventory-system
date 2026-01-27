const mongoose = require('mongoose');

// Esquema para los campos personalizados (Columnas)
const CampoSchema = new mongoose.Schema({
    nombreEtiqueta: { 
        type: String, 
        required: true 
    },
    tipoDato: { 
        type: String, 
        required: true,
        // Agregamos 'dropdown' y 'checkbox' a los tipos permitidos
        enum: ['text', 'number', 'date', 'dropdown', 'checkbox'] 
    },
    // Array de strings para guardar las opciones del dropdown (Ej: ["16GB", "32GB"])
    opciones: [{ 
        type: String 
    }] 
});

// Esquema principal del Tipo de Activo (Ej: Laptop, Celular)
const AssetTypeSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true, 
        unique: true 
    },
    campos: [CampoSchema], // Lista de campos dinámicos
    fechaCreacion: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('AssetType', AssetTypeSchema);
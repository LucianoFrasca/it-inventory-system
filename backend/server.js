const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './.env' });
console.log("Mi URI es:", process.env.MONGO_URI);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB usando la variable de entorno
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Conectado exitosamente a MongoDB Atlas'))
    .catch((err) => {
        console.error('❌ Error de conexión a MongoDB:');
        console.error(err);
    });

// Ruta de prueba para saber si el backend responde
app.get('/api/status', (req, res) => {
    res.json({ mensaje: "El servidor de InventorySoft está en línea 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
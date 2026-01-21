const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ 
  path: path.resolve(__dirname, '.env'),
  override: true 
});

// 1. PRIMERO creamos la app
const app = express();

// 2. SEGUNDO configuramos los middlewares
app.use(cors());
app.use(express.json());
const assetTypesRouter = require('./routes/assetTypes');
app.use('/api/asset-types', assetTypesRouter);



// Verificación de conexión (Diagnóstico)
console.log("--- Diagnóstico de Inicio ---");
console.log("¿URI detectada?:", process.env.MONGO_URI ? "SÍ ✅" : "NO ❌");
console.log("-----------------------------");

// 3. TERCERO conectamos a la base de datos
const mongoURI = "mongodb+srv://admin:EjyG1FaDeYpHzJ5b@inventorysoftcluster.j0ssayh.mongodb.net/?"

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Conectado exitosamente a MongoDB Atlas'))
    .catch((err) => {
        console.error('❌ Error de conexión a MongoDB:');
        console.error(err);
    });

// Ruta de prueba
app.get('/api/status', (req, res) => {
    res.json({ mensaje: "El servidor de InventorySoft está en línea 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
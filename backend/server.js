const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Configuración de variables de entorno
require('dotenv').config({ 
  path: path.resolve(__dirname, '.env'),
  override: true 
});

// Importar Rutas
const assetTypesRouter = require('./routes/assetTypes');
const usersRouter = require('./routes/users');
const assetsRouter = require('./routes/assets'); // <--- ¡Esta faltaba!
const authRouter = require('./routes/auth');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Verificación de conexión (Diagnóstico)
console.log("--- Diagnóstico ---");
console.log("Mongo URI Detectada:", process.env.MONGO_URI ? "SÍ ✅" : "NO ❌");

// Conexión a MongoDB
mongoose.connect("mongodb+srv://admin:EjyG1FaDeYpHzJ5b@inventorysoftcluster.j0ssayh.mongodb.net/?appName=InventorySoftCluster")
    .then(() => console.log('✅ Conectado exitosamente a MongoDB Atlas'))
    .catch((err) => console.error('❌ Error de conexión:', err));
// Usar Rutas (Endpoints)
app.use('/api/asset-types', assetTypesRouter);
app.use('/api/users', usersRouter);
app.use('/api/assets', assetsRouter); // <--- Middleware agregado
app.use('/api/auth', authRouter);


app.use('/api/users', require('./routes/users'));
app.use('/api/logs', require('./routes/logRoutes'));

// Ruta base de prueba
app.get('/', (req, res) => {
    res.send('API InventorySoft funcionando 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
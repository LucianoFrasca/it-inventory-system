const mongoose = require('mongoose');
const User = require('./models/User'); 

// 👇👇 PEGÁ TU URL DE MONGO ACÁ (La misma que usaste en createAdmin.js) 👇👇
const MONGO_URI = "mongodb+srv://admin:TU_PASSWORD_REAL@itcluster.mongodb.net/InventoryDB?retryWrites=true&w=majority";

const verUsuarios = async () => {
    try {
        await mongoose.connect("mongodb+srv://admin:EjyG1FaDeYpHzJ5b@inventorysoftcluster.j0ssayh.mongodb.net/?appName=InventorySoftCluster");
        console.log("📡 Conectado a la base de datos...");

        const usuarios = await User.find();
        
        console.log("\n--- LISTA DE USUARIOS ENCONTRADOS ---");
        usuarios.forEach(u => {
            console.log(`ID: ${u._id}`);
            console.log(`Email: ${u.email}`);
            console.log(`Rol: '${u.rol}'`); // Las comillas simples nos ayudarán a ver espacios extra
            console.log("-----------------------------------");
        });

        if (usuarios.length === 0) {
            console.log("⚠️ No hay usuarios en la base de datos.");
        }

        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

verUsuarios();
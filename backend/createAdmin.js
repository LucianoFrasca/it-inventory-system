const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Asegúrate de que la ruta sea correcta
require('dotenv').config();

const crearAdmin = async () => {
    try {
        await mongoose.connect("mongodb+srv://admin:EjyG1FaDeYpHzJ5b@inventorysoftcluster.j0ssayh.mongodb.net/?appName=InventorySoftCluster");
        console.log("Conectado a Mongo...");

        // 1. Datos de TU usuario
        const email = "test@gmail.com"; // <--- PON TU EMAIL AQUÍ
        const passwordPlano = "admin"; // <--- PON TU PASSWORD AQUÍ
        
        // 2. Encriptamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordPlano, salt);

        // 3. Creamos el objeto
        const adminUser = new User({
            nombre: "Luciano",    // <--- TU NOMBRE
            apellido: "Admin",
            email: email,
            password: hashedPassword,
            rol: "Administrador", // Importante: Debe coincidir con tu enum en User.js
            activosAsignados: []
        });

        // 4. Guardamos
        await adminUser.save();
        console.log("✅ Usuario Admin creado con éxito!");
        process.exit();
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

crearAdmin();
const Asset = require('../models/Asset');
const Log = require('../models/Log'); // <--- 1. VERIFICA QUE ESTA LÍNEA ESTÉ AQUÍ

// --- FUNCIÓN AUXILIAR PARA REGISTRAR LOGS ---
const registrarLog = async (accion, asset, usuarioNombre = 'Sistema', detalles = '') => {
    try {
        console.log(`📝 Intentando crear log: ${accion} - ${asset.modelo}`); // Debug en consola
        
        await Log.create({
            accion,
            activo: `${asset.marca} ${asset.modelo}`,
            serial: asset.serialNumber || 'S/N',
            usuario: usuarioNombre,
            detalles
        });
        
        console.log("✅ Log guardado con éxito en BD");
    } catch (e) {
        console.error("❌ ERROR AL CREAR LOG:", e);
    }
};

exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find().populate('tipo').populate('usuarioAsignado');
    res.json(assets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const newAsset = new Asset(req.body);
    const savedAsset = await newAsset.save();
    
    // LOG: CREACIÓN (Asegúrate que esto se ejecute)
    await registrarLog('Creación', savedAsset, 'Admin', 'Ingreso al inventario');
    
    res.status(201).json(savedAsset);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    // 1. Buscamos el activo ANTES de actualizar para comparar
    const activoAnterior = await Asset.findById(req.params.id).populate('usuarioAsignado');
    if (!activoAnterior) return res.status(404).json({ message: 'Activo no encontrado' });

    // 2. Actualizamos el activo
    const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('usuarioAsignado');

    // --- LÓGICA DE DETECCIÓN DE CAMBIOS PARA LOGS ---
    
    // A) BAJA (Prioridad 1)
    if (req.body.estado === 'Baja' && activoAnterior.estado !== 'Baja') {
        const motivo = req.body.detallesTecnicos?.['Motivo Baja'] || 'Sin motivo';
        const usuarioAnterior = activoAnterior.usuarioAsignado ? `${activoAnterior.usuarioAsignado.nombre} ${activoAnterior.usuarioAsignado.apellido}` : 'Sin asignar';
        await registrarLog('Baja', updatedAsset, usuarioAnterior, motivo);
    }

    // B) ASIGNACIÓN (Antes no tenía, ahora sí)
    else if (!activoAnterior.usuarioAsignado && updatedAsset.usuarioAsignado) {
        const nombreUsuario = `${updatedAsset.usuarioAsignado.nombre} ${updatedAsset.usuarioAsignado.apellido}`;
        await registrarLog('Asignación', updatedAsset, nombreUsuario, 'Entrega de equipo');
    }

    // C) DEVOLUCIÓN (Antes tenía, ahora no)
    else if (activoAnterior.usuarioAsignado && !updatedAsset.usuarioAsignado) {
        const nombreUsuario = `${activoAnterior.usuarioAsignado.nombre} ${activoAnterior.usuarioAsignado.apellido}`;
        await registrarLog('Devolución', activoAnterior, nombreUsuario, 'Equipo devuelto a stock');
    }

    // D) REASIGNACIÓN (Cambio de un usuario a otro directamente)
    else if (activoAnterior.usuarioAsignado && updatedAsset.usuarioAsignado && activoAnterior.usuarioAsignado._id.toString() !== updatedAsset.usuarioAsignado._id.toString()) {
        const nombreNuevo = `${updatedAsset.usuarioAsignado.nombre} ${updatedAsset.usuarioAsignado.apellido}`;
        const nombreViejo = `${activoAnterior.usuarioAsignado.nombre} ${activoAnterior.usuarioAsignado.apellido}`;
        await registrarLog('Reasignación', updatedAsset, nombreNuevo, `Transferido de ${nombreViejo}`);
    }

    // E) CAMBIO DE ESTADO SIMPLE (Ej: Disponible -> Reparación) <--- ESTO FALTABA
    else if (req.body.estado && req.body.estado !== activoAnterior.estado) {
        await registrarLog('Estado', updatedAsset, 'Sistema', `Cambió de ${activoAnterior.estado} a ${req.body.estado}`);
    }

    // F) EDICIÓN DE DETALLES (Opcional: Si cambian serial u otros datos)
    // ... Podrías agregarlo aquí si quisieras hilar muy fino.

    res.json(updatedAsset);
  } catch (err) {
    console.error("Error en updateAsset:", err);
    res.status(400).json({ message: err.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if(asset) {
        await registrarLog('Eliminación', asset, 'Admin', 'Eliminado permanentemente');
        await Asset.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Activo eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.bulkImport = async (req, res) => {
    try {
        const { tipoId, activos } = req.body;
        const docs = activos.map(a => ({ ...a, tipo: tipoId }));
        await Asset.insertMany(docs);
        
        // Log genérico de importación
        await Log.create({
            accion: 'Importación',
            activo: 'Múltiples Activos',
            serial: 'Lote Masivo',
            usuario: 'Admin',
            detalles: `Se importaron ${activos.length} registros`
        });

        res.status(201).json({ message: 'Importación exitosa' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
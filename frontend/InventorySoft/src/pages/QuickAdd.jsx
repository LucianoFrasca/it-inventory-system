import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Save, Laptop, ArrowLeft, CheckCircle } from 'lucide-react';

// URL API (Asegúrate de que coincida con tu config)
const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : 'https://itsoft-backend.onrender.com/api';

const QuickAdd = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Estados para selectores
  const [tipos, setTipos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Estado del formulario
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    serialNumber: '',
    estado: 'Disponible',
    usuarioAsignado: '',
    detallesTecnicos: {}
  });

  // 1. Cargar Tipos y Usuarios al iniciar
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
          navigate('/login'); 
          return;
      }

      try {
        const [resTipos, resUsers] = await Promise.all([
          axios.get(`${API_URL}/asset-types`, { headers: { 'x-auth-token': token } }),
          axios.get(`${API_URL}/users`, { headers: { 'x-auth-token': token } })
        ]);

        setTipos(resTipos.data);
        setUsuarios(resUsers.data);

        // Intentar seleccionar "Laptops" u "Ordenadores" automáticamente
        const laptopType = resTipos.data.find(t => 
            t.nombre.toLowerCase().includes('laptop') || 
            t.nombre.toLowerCase().includes('notebook') ||
            t.nombre.toLowerCase().includes('pc')
        );
        if (laptopType) setSelectedTypeId(laptopType._id);

        // 2. LEER DATOS DEL QR (Url Param "data")
        const dataParam = searchParams.get('data');
        if (dataParam) {
            try {
                // Decodificar Base64
                const jsonStr = atob(dataParam);
                const qrData = JSON.parse(jsonStr);

                // Pre-llenar formulario
                setFormData(prev => ({
                    ...prev,
                    marca: qrData.marca || '',
                    modelo: qrData.modelo || '',
                    serialNumber: qrData.serialNumber || '',
                    // Los demás campos técnicos van a un objeto temporal para mezclarlos luego
                    detallesTecnicos: qrData.detalles || {}
                }));
            } catch (e) {
                console.error("Error decodificando QR:", e);
                alert("El código QR no tiene un formato válido.");
            }
        }

      } catch (e) {
        console.error(e);
        if(e.response?.status === 401) navigate('/login');
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDetalleChange = (key, value) => {
    setFormData(prev => ({
        ...prev,
        detallesTecnicos: { ...prev.detallesTecnicos, [key]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTypeId) return alert("Selecciona un tipo de activo");
    
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
        // Construir objeto final
        // Mezclamos los detalles que vienen del QR con los campos del Tipo
        const activeType = tipos.find(t => t._id === selectedTypeId);
        const detallesFinales = { ...formData.detallesTecnicos };

        // Asegurarnos de que los campos del tipo existan en detalles
        activeType.campos.forEach(c => {
             const k = c.nombreEtiqueta;
             if (!['Marca','Modelo','Serial Number','Estado','Usuario Asignado'].includes(k)) {
                 // Si no está ya lleno por el QR, lo mantenemos (o vacío)
                 if (!detallesFinales[k]) detallesFinales[k] = '';
             }
        });

        const body = {
            tipo: selectedTypeId,
            marca: formData.marca,
            modelo: formData.modelo,
            serialNumber: formData.serialNumber,
            estado: formData.usuarioAsignado ? 'Asignado' : formData.estado,
            usuarioAsignado: formData.usuarioAsignado || null,
            detallesTecnicos: detallesFinales
        };

        await axios.post(`${API_URL}/assets`, body, { headers: { 'x-auth-token': token } });
        
        alert("¡Activo registrado con éxito!");
        navigate('/activos'); // Volver al listado

    } catch (e) {
        console.error(e);
        alert("Error al guardar: " + (e.response?.data?.message || e.message));
    } finally {
        setLoading(false);
    }
  };

  const currentType = tipos.find(t => t._id === selectedTypeId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 pb-20">
      <div className="max-w-md mx-auto">
        
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/')} className="p-2 bg-slate-800 rounded-full"><ArrowLeft/></button>
            <h1 className="text-xl font-bold text-white flex items-center gap-2"><Laptop className="text-blue-500"/> Alta Rápida (QR)</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. SELECCIÓN DE TIPO */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo de Activo</label>
                <select 
                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white"
                    value={selectedTypeId}
                    onChange={e => setSelectedTypeId(e.target.value)}
                >
                    <option value="">-- Seleccionar --</option>
                    {tipos.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
                </select>
            </div>

            {/* 2. DATOS PRINCIPALES (Vienen del QR) */}
            <div className="bg-slate-800 p-4 rounded-xl border border-blue-500/30 shadow-lg">
                <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2"><CheckCircle size={16}/> Datos Detectados</h3>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-400">Marca</label>
                        <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded" value={formData.marca} onChange={e => handleInputChange('marca', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400">Modelo</label>
                        <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded" value={formData.modelo} onChange={e => handleInputChange('modelo', e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400">Serial Number</label>
                        <input className="w-full bg-slate-900 border border-slate-700 p-2 rounded font-mono text-yellow-400" value={formData.serialNumber} onChange={e => handleInputChange('serialNumber', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* 3. CAMPOS ADICIONALES DEL TIPO */}
            {currentType && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <h3 className="font-bold mb-4 text-white">Detalles Técnicos</h3>
                    <div className="space-y-3">
                        {currentType.campos.map(campo => {
                            if (['Marca','Modelo','Serial Number','Estado','Usuario Asignado'].includes(campo.nombreEtiqueta)) return null;
                            
                            // Buscar si vino en el QR con ese nombre o similar
                            const valorPre = formData.detallesTecnicos[campo.nombreEtiqueta] || '';

                            return (
                                <div key={campo.nombreEtiqueta}>
                                    <label className="text-xs text-slate-400 block mb-1">{campo.nombreEtiqueta}</label>
                                    <input 
                                        className="w-full bg-slate-900 border border-slate-700 p-2 rounded"
                                        value={valorPre}
                                        onChange={e => handleDetalleChange(campo.nombreEtiqueta, e.target.value)}
                                        placeholder={campo.tipoDato}
                                        type={campo.tipoDato === 'number' ? 'number' : 'text'}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 4. ASIGNACIÓN (Manual) */}
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Asignar a Usuario (Opcional)</label>
                 <select 
                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white"
                    value={formData.usuarioAsignado}
                    onChange={e => handleInputChange('usuarioAsignado', e.target.value)}
                >
                    <option value="">-- Sin Asignar (Stock) --</option>
                    {usuarios.map(u => <option key={u._id} value={u._id}>{u.nombre} {u.apellido}</option>)}
                </select>
            </div>

            <button disabled={loading} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-white shadow-lg text-lg flex justify-center gap-2 items-center">
                {loading ? 'Guardando...' : <><Save/> Guardar Activo</>}
            </button>

        </form>
      </div>
    </div>
  );
};

export default QuickAdd;
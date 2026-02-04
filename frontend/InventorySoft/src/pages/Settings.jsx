import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Moon, Sun, Globe, Save, Lock, Camera, 
  Layout, Database, Plus, Trash2, CheckCircle, AlertCircle, X, Pencil 
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // --- ESTADOS: PERFIL ---
  const [userData, setUserData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: '',
    avatar: null
  });

  // --- ESTADOS: APARIENCIA ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'es');

  // --- ESTADOS: GESTIÓN DE TIPOS ---
  const [tipos, setTipos] = useState([]);
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [nuevosCampos, setNuevosCampos] = useState([]);
  const [campoTemp, setCampoTemp] = useState({ nombre: '', tipo: 'text', opciones: '' });
  
  // Estado para saber si estamos editando uno existente
  const [idEdicionTipo, setIdEdicionTipo] = useState(null); 

  // 1. CARGA INICIAL
  useEffect(() => {
    cargarDatosIniciales();
    aplicarTema(theme);
  }, []);

  const aplicarTema = (tema) => {
      const root = window.document.documentElement;
      if (tema === 'dark') {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }
      localStorage.setItem('theme', tema);
  };

  const cargarDatosIniciales = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // 1. Cargar Tipos de Activos
        const resTipos = await axios.get('http://localhost:5000/api/asset-types');
        if (Array.isArray(resTipos.data)) setTipos(resTipos.data);

        // 2. Cargar Perfil del Usuario Real
        // Decodificamos el token o llamamos a un endpoint "/me"
        // Como no tenemos endpoint "/me" configurado, asumiremos que guardaste el user en localStorage al login
        // O intentaremos buscarlo por ID si lo tienes. 
        // OPCIÓN MEJORADA: Buscar el usuario actual basado en el token
        // (Esto asume que tienes un endpoint para obtener el usuario actual o un ID guardado)
        const storedUser = JSON.parse(localStorage.getItem('user')); 
        if (storedUser && storedUser.id) {
             const resUser = await axios.get(`http://localhost:5000/api/users/${storedUser.id}`);
             setUserData(resUser.data);
        } else {
            // Fallback si no hay ID guardado, usamos datos del localStorage directo
            if (storedUser) setUserData(storedUser);
        }

    } catch (e) { 
        console.error("Error cargando datos:", e);
    }
  };

  // --- LÓGICA APARIENCIA ---
  const handleThemeChange = (newTheme) => {
      setTheme(newTheme);
      aplicarTema(newTheme);
      mostrarMensaje('success', `Tema ${newTheme === 'dark' ? 'Oscuro' : 'Claro'} aplicado.`);
  };

  const handleLanguageChange = (lang) => {
      setLanguage(lang);
      localStorage.setItem('lang', lang);
      mostrarMensaje('info', 'Idioma cambiado (Requiere recargar para aplicar textos).');
  };

  // --- LÓGICA PERFIL ---
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserData(prev => ({ ...prev, avatar: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const guardarPerfil = async () => {
    setLoading(true);
    try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.id) {
            await axios.put(`http://localhost:5000/api/users/${storedUser.id}`, userData);
            // Actualizar localStorage también
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...userData }));
            mostrarMensaje('success', 'Perfil actualizado correctamente.');
        } else {
            mostrarMensaje('error', 'No se pudo identificar al usuario.');
        }
    } catch (e) {
        mostrarMensaje('error', 'Error al actualizar perfil.');
    } finally {
        setLoading(false);
    }
  };

  // --- LÓGICA GESTIÓN TIPOS (EDITAR Y CREAR) ---
  
  const prepararEdicionTipo = (tipo) => {
      setNuevoTipo(tipo.nombre);
      setNuevosCampos(tipo.campos || []);
      setIdEdicionTipo(tipo._id);
      // Hacemos scroll hacia el formulario
      const formElement = document.getElementById('form-tipo-activo');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
      setNuevoTipo('');
      setNuevosCampos([]);
      setIdEdicionTipo(null);
  };

  const agregarCampo = () => {
    if (!campoTemp.nombre) return;
    setNuevosCampos([...nuevosCampos, { 
        nombreEtiqueta: campoTemp.nombre, 
        tipoDato: campoTemp.tipo,
        opciones: campoTemp.tipo === 'dropdown' && campoTemp.opciones ? campoTemp.opciones.split(',').map(s => s.trim()) : []
    }]);
    setCampoTemp({ nombre: '', tipo: 'text', opciones: '' });
  };

  const guardarTipo = async () => {
    if (!nuevoTipo) return alert('Escribe un nombre para el tipo');
    
    try {
        const payload = {
            nombre: nuevoTipo,
            campos: nuevosCampos
        };

        if (idEdicionTipo) {
            // MODO EDICIÓN (PUT)
            await axios.put(`http://localhost:5000/api/asset-types/${idEdicionTipo}`, payload);
            mostrarMensaje('success', `Tipo "${nuevoTipo}" actualizado.`);
        } else {
            // MODO CREACIÓN (POST)
            await axios.post('http://localhost:5000/api/asset-types', payload);
            mostrarMensaje('success', `Tipo "${nuevoTipo}" creado.`);
        }

        // Limpieza y recarga
        cancelarEdicion();
        
        // Recargar lista
        const res = await axios.get('http://localhost:5000/api/asset-types');
        setTipos(res.data);

    } catch (e) {
        console.error(e);
        mostrarMensaje('error', 'Error al guardar en base de datos.');
    }
  };

  const eliminarTipo = async (id) => {
      if(!window.confirm("¿Estás seguro? Se perderá la configuración de campos.")) return;
      try {
          await axios.delete(`http://localhost:5000/api/asset-types/${id}`);
          const res = await axios.get('http://localhost:5000/api/asset-types');
          setTipos(res.data);
          mostrarMensaje('success', 'Tipo eliminado.');
      } catch (e) { console.error(e); }
  };

  const mostrarMensaje = (tipo, texto) => {
      setMensaje({ tipo, texto });
      setTimeout(() => setMensaje(null), 3000);
  };

  return (
    <div className="p-8 min-h-screen transition-colors duration-300 text-slate-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-900 animate-fade-in max-w-6xl mx-auto rounded-xl">
      
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Layout className="text-blue-500" size={32}/> Configuración
      </h1>

      {mensaje && (
          <div className={`fixed top-10 right-10 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce text-white ${mensaje.tipo === 'success' ? 'bg-green-600' : mensaje.tipo === 'info' ? 'bg-blue-600' : 'bg-red-600'}`}>
              {mensaje.tipo === 'success' ? <CheckCircle/> : <AlertCircle/>}
              <span className="font-bold">{mensaje.texto}</span>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* SIDEBAR */}
        <div className="md:col-span-1 space-y-2">
            <button onClick={() => setActiveTab('profile')} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`}><User size={20}/> Mi Perfil</button>
            <button onClick={() => setActiveTab('appearance')} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-all ${activeTab === 'appearance' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`}><Sun size={20}/> Apariencia</button>
            <button onClick={() => setActiveTab('inventory')} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`}><Database size={20}/> Inventario</button>
        </div>

        {/* CONTENIDO */}
        <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 shadow-xl min-h-[500px] transition-colors duration-300">
            
            {/* PERFIL */}
            {activeTab === 'profile' && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-slate-700">Mi Perfil</h2>
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden border-4 border-gray-300 dark:border-slate-600">
                                {userData.avatar ? <img src={userData.avatar} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500"><User size={40}/></div>}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-500 shadow-lg text-white"><Camera size={16}/><input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange}/></label>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{userData.nombre} {userData.apellido}</h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{userData.email}</p>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded mt-1 inline-block">{userData.rol || 'Usuario'}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase mb-2 block">Nombre</label><input className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-3 rounded-lg outline-none focus:border-blue-500 transition-colors" value={userData.nombre} onChange={e => setUserData({...userData, nombre: e.target.value})}/></div>
                        <div><label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase mb-2 block">Apellido</label><input className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-3 rounded-lg outline-none focus:border-blue-500 transition-colors" value={userData.apellido} onChange={e => setUserData({...userData, apellido: e.target.value})}/></div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <button onClick={guardarPerfil} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">{loading ? '...' : <><Save size={18}/> Guardar Cambios</>}</button>
                    </div>
                </div>
            )}

            {/* APARIENCIA */}
            {activeTab === 'appearance' && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-slate-700">Visualización</h2>
                    <div className="mb-8">
                        <label className="text-sm font-bold text-gray-500 dark:text-slate-300 mb-4 block">Tema</label>
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                            <div onClick={() => handleThemeChange('light')} className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}>
                                <Sun size={32} className={theme === 'light' ? 'text-yellow-500' : 'text-gray-400'}/>
                                <span className="font-bold text-sm">Claro</span>
                            </div>
                            <div onClick={() => handleThemeChange('dark')} className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-slate-700' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}>
                                <Moon size={32} className={theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}/>
                                <span className="font-bold text-sm">Oscuro</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-500 dark:text-slate-300 mb-4 block">Idioma</label>
                        <div className="max-w-md relative">
                            <Globe className="absolute left-3 top-3 text-gray-400" size={20}/>
                            <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-3 pl-10 rounded-lg outline-none focus:border-blue-500 appearance-none cursor-pointer transition-colors">
                                <option value="es">Español</option>
                                <option value="en">English</option>
                                <option value="pt">Português</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* INVENTARIO */}
            {activeTab === 'inventory' && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-slate-700">Tipos de Activos</h2>
                    
                    {/* Lista con Botón de Edición */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        {tipos.map(t => (
                            <div key={t._id} className={`p-3 rounded-lg border flex justify-between items-center group transition-all ${idEdicionTipo === t._id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700'}`}>
                                <span className="font-bold text-sm">{t.nombre}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => prepararEdicionTipo(t)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Editar campos"><Pencil size={16}/></button>
                                    <button onClick={() => eliminarTipo(t._id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Eliminar tipo"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Formulario Inteligente (Crear/Editar) */}
                    <div id="form-tipo-activo" className={`p-6 rounded-xl border border-dashed transition-all ${idEdicionTipo ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-400' : 'bg-gray-50 dark:bg-slate-900/50 border-gray-300 dark:border-slate-700'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-blue-500 flex items-center gap-2">
                                {idEdicionTipo ? <><Pencil size={20}/> Editando: {nuevoTipo}</> : <><Plus size={20}/> Crear Nuevo Tipo</>}
                            </h3>
                            {idEdicionTipo && <button onClick={cancelarEdicion} className="text-xs text-red-500 hover:underline">Cancelar edición</button>}
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase mb-1 block">Nombre del Tipo</label>
                            <input className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 p-2 rounded text-sm outline-none focus:border-blue-500 transition-colors" placeholder="Ej: Tablet" value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)}/>
                        </div>

                        <div className="space-y-2 mb-4">
                            {nuevosCampos.length > 0 && <p className="text-xs font-bold text-gray-500 uppercase">Campos definidos:</p>}
                            {nuevosCampos.map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 p-2 rounded border border-gray-200 dark:border-slate-700 shadow-sm">
                                    <span className="font-bold">{c.nombreEtiqueta}</span>
                                    <span className="text-xs bg-gray-200 dark:bg-slate-600 px-2 rounded">{c.tipoDato}</span>
                                    <button onClick={() => setNuevosCampos(nuevosCampos.filter((_, idx) => idx !== i))} className="ml-auto text-red-400 hover:text-red-600"><X size={14}/></button>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-12 gap-2 items-end mb-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                            <div className="col-span-5"><label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Nombre Campo</label><input className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-2 rounded text-xs outline-none" placeholder="Ej: RAM" value={campoTemp.nombre} onChange={e => setCampoTemp({...campoTemp, nombre: e.target.value})}/></div>
                            <div className="col-span-4"><label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Tipo de Dato</label><select className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-2 rounded text-xs outline-none" value={campoTemp.tipo} onChange={e => setCampoTemp({...campoTemp, tipo: e.target.value})}><option value="text">Texto</option><option value="number">Número</option><option value="date">Fecha</option><option value="dropdown">Lista</option></select></div>
                            <div className="col-span-3"><button onClick={agregarCampo} className="w-full bg-slate-700 hover:bg-slate-600 text-white p-2 rounded text-xs font-bold h-[34px]">Agregar</button></div>
                            {campoTemp.tipo === 'dropdown' && (<div className="col-span-12 mt-2"><input className="w-full bg-gray-100 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-2 rounded text-xs outline-none" placeholder="Opciones separadas por coma (Ej: 8GB, 16GB, 32GB)" value={campoTemp.opciones} onChange={e => setCampoTemp({...campoTemp, opciones: e.target.value})}/></div>)}
                        </div>

                        <button onClick={guardarTipo} className={`w-full text-white py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 ${idEdicionTipo ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-500'}`}>
                            {idEdicionTipo ? 'Guardar Cambios' : 'Crear Tipo'}
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
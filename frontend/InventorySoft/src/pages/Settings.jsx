import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Moon, Sun, Save, Camera, 
  Layout, Database, Plus, Trash2, Edit2, 
  ArrowUp, ArrowDown, CheckSquare, X, AlertCircle
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

// Detectar URL (Local vs Prod)
const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : 'https://itsoft-backend.onrender.com/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // --- ESTADO USUARIO ---
  const [userData, setUserData] = useState({
    nombre: '', apellido: '', email: '', cargo: '', area: '', rol: '', avatar: null, password: ''
  });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // --- ESTADO INVENTARIO (TIPOS DE ACTIVOS) ---
  const [tipos, setTipos] = useState([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null); // El tipo que estamos editando
  const [campos, setCampos] = useState([]); // Los campos de ese tipo
  
  // Formulario para campos
  const [campoTemp, setCampoTemp] = useState({ nombreEtiqueta: '', tipoDato: 'text', opciones: '' });
  const [indiceEdicionCampo, setIndiceEdicionCampo] = useState(null); // null = nuevo, numero = editando

  useEffect(() => {
    cargarDatos();
    aplicarTema(theme);
  }, []);

  const aplicarTema = (tema) => {
      const root = window.document.documentElement;
      if (tema === 'dark') root.classList.add('dark');
      else root.classList.remove('dark');
      localStorage.setItem('theme', tema);
  };

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    
    if (!token) return;

    try {
        const config = { headers: { 'x-auth-token': token } };
        
        // 1. Cargar Usuario
        if (storedUser) {
            const userId = storedUser.id || storedUser._id;
            try {
                const resUser = await axios.get(`${API_URL}/users/${userId}`, config);
                setUserData(prev => ({ ...prev, ...resUser.data, password: '' }));
            } catch (errUser) {
                console.warn("No se pudo cargar usuario actualizado", errUser);
            }
        }

        // 2. Cargar Tipos de Activos
        const resTipos = await axios.get(`${API_URL}/asset-types`, config);
        console.log("Tipos cargados:", resTipos.data); // DEBUG
        setTipos(Array.isArray(resTipos.data) ? resTipos.data : []);

    } catch (e) { 
        console.error("Error general cargando datos:", e);
        mostrarMensaje('error', 'Error de conexión con el servidor.');
    }
  };

  // --- FUNCIONES DE PERFIL ---
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2*1024*1024) return alert("Imagen muy pesada (Max 2MB)");
        const reader = new FileReader();
        reader.onloadend = () => setUserData(prev => ({ ...prev, avatar: reader.result }));
        reader.readAsDataURL(file);
    }
  };

  const guardarPerfil = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const userId = storedUser?.id || storedUser?._id;

    try {
        const payload = { ...userData };
        if (!payload.password) delete payload.password;
        const res = await axios.put(`${API_URL}/users/${userId}`, payload, { headers: { 'x-auth-token': token } });
        setUserData(prev => ({ ...prev, ...res.data, password: '' }));
        localStorage.setItem('user', JSON.stringify(res.data));
        window.dispatchEvent(new Event('storage'));
        mostrarMensaje('success', 'Perfil actualizado.');
    } catch (e) { mostrarMensaje('error', 'Error al guardar.'); }
    finally { setLoading(false); }
  };

  // --- FUNCIONES DE GESTIÓN DE CAMPOS ---
  
  const seleccionarTipo = (tipo) => {
      setTipoSeleccionado(tipo);
      // Clonamos los campos para no mutar directo. Aseguramos que sea array.
      setCampos(Array.isArray(tipo.campos) ? [...tipo.campos] : []); 
      setCampoTemp({ nombreEtiqueta: '', tipoDato: 'text', opciones: '' });
      setIndiceEdicionCampo(null);
  };

  const cancelarEdicionTipo = () => {
      setTipoSeleccionado(null);
      setCampos([]);
      setIndiceEdicionCampo(null);
  };

  const guardarCampoEnLista = () => {
      if (!campoTemp.nombreEtiqueta) return alert("Escribe un nombre para el campo");

      const nuevosCampos = [...campos];
      const campoFormateado = {
          ...campoTemp,
          // Si es dropdown, convertimos opciones a array
          opciones: campoTemp.tipoDato === 'dropdown' ? String(campoTemp.opciones).split(',').map(s=>s.trim()) : []
      };

      if (indiceEdicionCampo !== null) {
          nuevosCampos[indiceEdicionCampo] = campoFormateado; // Editar
          setIndiceEdicionCampo(null);
      } else {
          nuevosCampos.push(campoFormateado); // Crear
      }

      setCampos(nuevosCampos);
      setCampoTemp({ nombreEtiqueta: '', tipoDato: 'text', opciones: '' }); // Limpiar form
  };

  const editarCampo = (index) => {
      const c = campos[index];
      setCampoTemp({
          nombreEtiqueta: c.nombreEtiqueta,
          tipoDato: c.tipoDato,
          opciones: Array.isArray(c.opciones) ? c.opciones.join(', ') : (c.opciones || '')
      });
      setIndiceEdicionCampo(index);
  };

  const eliminarCampo = (index) => {
      if (window.confirm('¿Borrar este campo?')) {
          setCampos(campos.filter((_, i) => i !== index));
          if (indiceEdicionCampo === index) {
              setIndiceEdicionCampo(null);
              setCampoTemp({ nombreEtiqueta: '', tipoDato: 'text', opciones: '' });
          }
      }
  };

  const moverCampo = (index, direccion) => {
      if (index + direccion < 0 || index + direccion >= campos.length) return;
      const nuevos = [...campos];
      const temp = nuevos[index];
      nuevos[index] = nuevos[index + direccion];
      nuevos[index + direccion] = temp;
      setCampos(nuevos);
      if (indiceEdicionCampo === index) setIndiceEdicionCampo(index + direccion);
  };

  const guardarCambiosTipo = async () => {
      if (!tipoSeleccionado) return;
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
          await axios.put(`${API_URL}/asset-types/${tipoSeleccionado._id}`, {
              nombre: tipoSeleccionado.nombre,
              campos: campos
          }, { headers: { 'x-auth-token': token } });
          
          mostrarMensaje('success', 'Estructura guardada correctamente.');
          await cargarDatos(); 
          setTipoSeleccionado(null);
      } catch (e) {
          console.error(e);
          mostrarMensaje('error', 'Error al guardar estructura.');
      } finally {
          setLoading(false);
      }
  };

  const mostrarMensaje = (tipo, texto) => {
      setMensaje({ tipo, texto });
      setTimeout(() => setMensaje(null), 3000);
  };

  return (
    <div className="p-4 md:p-8 text-slate-800 dark:text-slate-200 animate-fade-in max-w-6xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <Layout className="text-blue-500" size={32}/> Configuración
      </h1>
      
      {mensaje && (
          <div className={`fixed top-20 right-10 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce text-white ${mensaje.tipo === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              <span className="font-bold">{mensaje.texto}</span>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* MENU LATERAL */}
        <div className="md:col-span-1 space-y-2">
            <button onClick={() => setActiveTab('profile')} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`}><User size={20}/> Mi Perfil</button>
            <button onClick={() => setActiveTab('inventory')} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-all ${activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`}><Database size={20}/> Inventario</button>
            <button onClick={() => setActiveTab('appearance')} className={`w-full text-left p-4 rounded-xl font-bold flex items-center gap-3 transition-all ${activeTab === 'appearance' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700'}`}><Sun size={20}/> Apariencia</button>
        </div>

        {/* CONTENIDO */}
        <div className="md:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 shadow-xl min-h-[500px]">
            
            {/* --- TAB PERFIL --- */}
            {activeTab === 'profile' && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-slate-700">Editar Perfil</h2>
                    <div className="flex items-center gap-6 mb-8">
                        <div className="relative group">
                            <UserAvatar user={userData} size={96} className="border-4 border-slate-200 dark:border-slate-600 text-3xl" />
                            <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-500 shadow-lg text-white transition-transform hover:scale-110">
                                <Camera size={18}/> <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange}/>
                            </label>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">{userData.nombre || 'Usuario'} {userData.apellido}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">{userData.email}</p>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded mt-2 inline-block font-bold uppercase tracking-wider">{userData.rol || 'Usuario'}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nombre</label><input className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-3 rounded-lg outline-none focus:border-blue-500 transition-colors" value={userData.nombre} onChange={e => setUserData({...userData, nombre: e.target.value})}/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Apellido</label><input className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-3 rounded-lg outline-none focus:border-blue-500 transition-colors" value={userData.apellido} onChange={e => setUserData({...userData, apellido: e.target.value})}/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Cargo</label><input className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-3 rounded-lg outline-none focus:border-blue-500 transition-colors" value={userData.cargo || ''} onChange={e => setUserData({...userData, cargo: e.target.value})}/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Área</label><input className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-3 rounded-lg outline-none focus:border-blue-500 transition-colors" value={userData.area || ''} onChange={e => setUserData({...userData, area: e.target.value})}/></div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-300">Seguridad</h3>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nueva Contraseña</label><input type="password" className="w-full md:w-1/2 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 p-3 rounded-lg outline-none focus:border-blue-500 transition-colors" placeholder="Opcional" value={userData.password} onChange={e => setUserData({...userData, password: e.target.value})}/></div>
                    </div>
                    <div className="mt-8 flex justify-end"><button onClick={guardarPerfil} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">{loading ? 'Guardando...' : <><Save size={18}/> Guardar Cambios</>}</button></div>
                </div>
            )}

            {/* --- TAB INVENTARIO (CORREGIDO) --- */}
            {activeTab === 'inventory' && (
                <div className="animate-fade-in">
                    {!tipoSeleccionado ? (
                        <>
                            <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-slate-700 flex justify-between">
                                <span>Tipos de Activos</span>
                                <span className="text-xs font-normal text-slate-400 mt-1 block">Selecciona uno para editar su estructura</span>
                            </h2>
                            
                            {tipos.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                                    <AlertCircle className="mx-auto text-slate-400 mb-2" size={32}/>
                                    <p className="text-slate-500">No hay tipos de activos creados.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {tipos.map(t => (
                                        <div key={t._id} onClick={() => seleccionarTipo(t)} className="p-6 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 transition-all hover:shadow-lg group">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t.nombre}</h3>
                                                <Edit2 size={18} className="text-slate-400 group-hover:text-blue-500"/>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {Array.isArray(t.campos) ? t.campos.length : 0} campos configurados
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                    <span className="text-blue-500">{tipoSeleccionado.nombre}</span> <span className="text-slate-400">/ Estructura</span>
                                </h2>
                                <button onClick={cancelarEdicionTipo} className="text-sm flex items-center gap-2 text-slate-500 hover:text-white px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                                    <X size={14}/> Volver
                                </button>
                            </div>

                            {/* FORMULARIO DE CAMPO */}
                            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 shadow-inner">
                                <h4 className="text-sm font-bold uppercase text-slate-500 mb-3 flex items-center gap-2">
                                    {indiceEdicionCampo !== null ? <><Edit2 size={14}/> Editar Campo</> : <><Plus size={14}/> Nuevo Campo</>}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-4">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Nombre (Etiqueta)</label>
                                        <input className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:border-blue-500 outline-none" placeholder="Ej: Memoria RAM" value={campoTemp.nombreEtiqueta} onChange={e => setCampoTemp({...campoTemp, nombreEtiqueta: e.target.value})}/>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Tipo de Dato</label>
                                        <select className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:border-blue-500 outline-none" value={campoTemp.tipoDato} onChange={e => setCampoTemp({...campoTemp, tipoDato: e.target.value})}>
                                            <option value="text">Texto</option>
                                            <option value="number">Número</option>
                                            <option value="date">Fecha</option>
                                            <option value="dropdown">Lista (Dropdown)</option>
                                            <option value="checkbox">Checkbox (Sí/No)</option>
                                        </select>
                                    </div>
                                    {campoTemp.tipoDato === 'dropdown' && (
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Opciones (sep. por coma)</label>
                                            <input className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm" placeholder="Opción A, Opción B..." value={campoTemp.opciones} onChange={e => setCampoTemp({...campoTemp, opciones: e.target.value})}/>
                                        </div>
                                    )}
                                    <div className="md:col-span-2 flex flex-col gap-2">
                                        <button onClick={guardarCampoEnLista} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded text-sm font-bold transition-colors shadow">
                                            {indiceEdicionCampo !== null ? 'Actualizar' : 'Agregar'}
                                        </button>
                                        {indiceEdicionCampo !== null && (
                                            <button onClick={() => { setIndiceEdicionCampo(null); setCampoTemp({ nombreEtiqueta: '', tipoDato: 'text', opciones: '' }); }} className="w-full text-xs text-red-400 hover:text-red-300">Cancelar</button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* LISTA DE CAMPOS REORDENABLE */}
                            <div className="space-y-2">
                                {campos.map((c, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${indiceEdicionCampo === i ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                                        
                                        {/* BOTONES DE ORDEN */}
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => moverCampo(i, -1)} disabled={i === 0} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"><ArrowUp size={14} className="text-slate-500"/></button>
                                            <button onClick={() => moverCampo(i, 1)} disabled={i === campos.length - 1} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"><ArrowDown size={14} className="text-slate-500"/></button>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{c.nombreEtiqueta}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono uppercase border border-slate-300 dark:border-slate-600">{c.tipoDato}</span>
                                            </div>
                                            {c.tipoDato === 'dropdown' && <p className="text-xs text-slate-400 mt-1">Opciones: {Array.isArray(c.opciones) ? c.opciones.join(', ') : c.opciones}</p>}
                                        </div>

                                        {/* ACCIONES */}
                                        <div className="flex gap-2">
                                            <button onClick={() => editarCampo(i)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title="Editar"><Edit2 size={16}/></button>
                                            <button onClick={() => eliminarCampo(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Eliminar"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
                                <button onClick={guardarCambiosTipo} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all">
                                    <Save size={18}/> Guardar Estructura
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- TAB APARIENCIA --- */}
            {activeTab === 'appearance' && (
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200 dark:border-slate-700">Tema del Sistema</h2>
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                        <div onClick={() => setTheme('light')} className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}><Sun size={32} className="text-yellow-500"/><span className="font-bold">Claro</span></div>
                        <div onClick={() => setTheme('dark')} className={`cursor-pointer p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-blue-500 bg-slate-700' : 'border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`}><Moon size={32} className="text-blue-400"/><span className="font-bold">Oscuro</span></div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
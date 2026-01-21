import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Package, Laptop, Smartphone, Monitor, Grid, X, Save, Pencil, Trash2, User } from 'lucide-react';

const Assets = () => {
  // --- ESTADOS DE DATOS ---
  const [activos, setActivos] = useState([]);
  const [tiposActivos, setTiposActivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]); // Nuevo: Lista de usuarios para el select

  // --- ESTADOS DE UI ---
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos'); // Para las cards

  // --- ESTADO DEL FORMULARIO ---
  const [nuevoActivo, setNuevoActivo] = useState({
    marca: '',
    modelo: '',
    serialNumber: '',
    estado: 'Disponible',
    tipo: '',
    usuarioAsignado: '' // Nuevo campo
  });
  const [detallesDinamicos, setDetallesDinamicos] = useState({});
  const [tipoSeleccionadoObj, setTipoSeleccionadoObj] = useState(null);

  // 1. CARGA INICIAL
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resActivos, resTipos, resUsuarios] = await Promise.all([
        axios.get('http://localhost:5000/api/assets'),
        axios.get('http://localhost:5000/api/asset-types'),
        axios.get('http://localhost:5000/api/users')
      ]);
      setActivos(resActivos.data);
      setTiposActivos(resTipos.data);
      setUsuarios(resUsuarios.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 2. LÓGICA DE CATEGORÍAS (CARDS)
  const contarPorCategoria = (keyword) => {
    if (keyword === 'Otros') {
      return activos.filter(a => {
        const nombre = a.tipo?.nombre?.toLowerCase() || '';
        return !nombre.includes('laptop') && !nombre.includes('celular') && !nombre.includes('monitor') && !nombre.includes('pantalla');
      }).length;
    }
    return activos.filter(a => a.tipo?.nombre?.toLowerCase().includes(keyword)).length;
  };

  // 3. MANEJO DEL FORMULARIO
  const handleTipoChange = (e) => {
    const tipoId = e.target.value;
    const tipoObj = tiposActivos.find(t => t._id === tipoId);
    setNuevoActivo({ ...nuevoActivo, tipo: tipoId });
    setTipoSeleccionadoObj(tipoObj);
    // No borramos detallesDinamicos si estamos en modo edición para no perder datos
    if (!modoEdicion) setDetallesDinamicos({}); 
  };

  const prepararEdicion = (activo) => {
    setModoEdicion(true);
    setIdEdicion(activo._id);
    setNuevoActivo({
      marca: activo.marca,
      modelo: activo.modelo,
      serialNumber: activo.serialNumber,
      estado: activo.estado,
      tipo: activo.tipo?._id,
      usuarioAsignado: activo.usuarioAsignado?._id || ''
    });
    setDetallesDinamicos(activo.detallesTecnicos || {});
    
    // Buscar el objeto del tipo para mostrar los campos correctos
    const tipoObj = tiposActivos.find(t => t._id === activo.tipo?._id);
    setTipoSeleccionadoObj(tipoObj);
    
    setMostrarFormulario(true);
  };

  const resetFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    setIdEdicion(null);
    setNuevoActivo({ marca: '', modelo: '', serialNumber: '', estado: 'Disponible', tipo: '', usuarioAsignado: '' });
    setDetallesDinamicos({});
    setTipoSeleccionadoObj(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...nuevoActivo,
      usuarioAsignado: nuevoActivo.usuarioAsignado || null, // Si está vacío enviar null
      detallesTecnicos: detallesDinamicos
    };

    try {
      if (modoEdicion) {
        await axios.put(`http://localhost:5000/api/assets/${idEdicion}`, payload);
        alert('Activo actualizado correctamente');
      } else {
        await axios.post('http://localhost:5000/api/assets', payload);
        alert('Activo creado correctamente');
      }
      cargarDatos();
      resetFormulario();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // 4. FILTRADO PARA LA TABLA
  const activosFiltrados = activos.filter(a => {
    // Filtro de Búsqueda
    const matchBusqueda = 
      a.serialNumber.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (a.usuarioAsignado && (a.usuarioAsignado.nombre + ' ' + a.usuarioAsignado.apellido).toLowerCase().includes(busqueda.toLowerCase()));

    // Filtro de Cards (Categorías)
    if (filtroCategoria === 'Todos') return matchBusqueda;
    const nombreTipo = a.tipo?.nombre?.toLowerCase() || '';
    
    if (filtroCategoria === 'laptops') return matchBusqueda && nombreTipo.includes('laptop');
    if (filtroCategoria === 'celulares') return matchBusqueda && (nombreTipo.includes('celular') || nombreTipo.includes('iphone'));
    if (filtroCategoria === 'monitores') return matchBusqueda && (nombreTipo.includes('monitor') || nombreTipo.includes('pantalla'));
    if (filtroCategoria === 'otros') return matchBusqueda && !nombreTipo.includes('laptop') && !nombreTipo.includes('celular') && !nombreTipo.includes('monitor');
    
    return matchBusqueda;
  });

  // --- COMPONENTE DE CARD ---
  const StatCard = ({ title, count, icon, active, onClick, color }) => (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
        active ? `bg-${color}-900/30 border-${color}-500 ring-1 ring-${color}-500` : 'bg-slate-800 border-slate-700 hover:border-slate-500'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-white mt-1">{count}</h3>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package className="text-blue-500"/> Gestión de Activos
        </h1>
        <button 
          onClick={() => { resetFormulario(); setMostrarFormulario(!mostrarFormulario); }}
          className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors ${mostrarFormulario ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {mostrarFormulario ? <><X size={20}/> Cancelar</> : <><Plus size={20}/> Nuevo Activo</>}
        </button>
      </div>

      {/* --- CARDS SUPERIORES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Laptops" 
          count={contarPorCategoria('laptop')} 
          icon={<Laptop size={24}/>}
          color="blue"
          active={filtroCategoria === 'laptops'}
          onClick={() => setFiltroCategoria(filtroCategoria === 'laptops' ? 'Todos' : 'laptops')}
        />
        <StatCard 
          title="Celulares" 
          count={contarPorCategoria('celular')} 
          icon={<Smartphone size={24}/>}
          color="green"
          active={filtroCategoria === 'celulares'}
          onClick={() => setFiltroCategoria(filtroCategoria === 'celulares' ? 'Todos' : 'celulares')}
        />
        <StatCard 
          title="Monitores" 
          count={contarPorCategoria('monitor')} 
          icon={<Monitor size={24}/>}
          color="purple"
          active={filtroCategoria === 'monitores'}
          onClick={() => setFiltroCategoria(filtroCategoria === 'monitores' ? 'Todos' : 'monitores')}
        />
        <StatCard 
          title="Otros Equipos" 
          count={contarPorCategoria('Otros')} 
          icon={<Grid size={24}/>}
          color="orange"
          active={filtroCategoria === 'otros'}
          onClick={() => setFiltroCategoria(filtroCategoria === 'otros' ? 'Todos' : 'otros')}
        />
      </div>

      {/* --- FORMULARIO --- */}
      {mostrarFormulario && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl mb-8 animate-fade-in-down">
          <h2 className="text-xl font-semibold mb-6 text-blue-400 flex items-center gap-2">
            {modoEdicion ? <Pencil size={20}/> : <Plus size={20}/>}
            {modoEdicion ? 'Editar Activo' : 'Registrar Nuevo Equipo'}
          </h2>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Información Básica</h3>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Tipo de Activo</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500"
                  value={nuevoActivo.tipo}
                  onChange={handleTipoChange}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {tiposActivos.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Marca</label>
                  <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" 
                    value={nuevoActivo.marca} onChange={e => setNuevoActivo({...nuevoActivo, marca: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Modelo</label>
                  <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                    value={nuevoActivo.modelo} onChange={e => setNuevoActivo({...nuevoActivo, modelo: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Serial Number</label>
                <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-mono"
                  value={nuevoActivo.serialNumber} onChange={e => setNuevoActivo({...nuevoActivo, serialNumber: e.target.value})} required />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado y Asignación</h3>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm text-slate-300 mb-1">Estado</label>
                  <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none"
                    value={nuevoActivo.estado} onChange={e => setNuevoActivo({...nuevoActivo, estado: e.target.value})}>
                    <option value="Disponible">🟢 Disponible</option>
                    <option value="Asignado">🔴 Asignado</option>
                    <option value="Reparación">🟡 En Reparación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Usuario Asignado</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none"
                    value={nuevoActivo.usuarioAsignado}
                    onChange={e => setNuevoActivo({...nuevoActivo, usuarioAsignado: e.target.value})}
                  >
                    <option value="">-- Sin Asignar --</option>
                    {usuarios.map(u => (
                      <option key={u._id} value={u._id}>{u.nombre} {u.apellido}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CAMPOS DINÁMICOS */}
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">
                  Detalles {tipoSeleccionadoObj ? `(${tipoSeleccionadoObj.nombre})` : ''}
                </h3>
                {tipoSeleccionadoObj ? (
                  tipoSeleccionadoObj.campos.map((campo, index) => (
                    <div key={index} className="mb-2">
                      <label className="text-xs text-slate-400 block mb-1">{campo.nombreEtiqueta}</label>
                      <input 
                        type={campo.tipoDato === 'number' ? 'number' : 'text'}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 text-sm text-white focus:border-blue-500 outline-none"
                        value={detallesDinamicos[campo.nombreEtiqueta] || ''}
                        onChange={(e) => setDetallesDinamicos({...detallesDinamicos, [campo.nombreEtiqueta]: e.target.value})}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs italic">Selecciona un tipo para ver campos extra.</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-700">
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded flex justify-center items-center gap-2">
                <Save size={18}/> {modoEdicion ? 'Guardar Cambios' : 'Registrar Activo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={20}/>
        <input 
          type="text"
          placeholder="Buscar por Serial, Modelo o Usuario..."
          className="w-full pl-10 bg-slate-800 border border-slate-700 text-white p-3 rounded-lg outline-none focus:border-blue-500"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* --- TABLA --- */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Equipo</th>
              <th className="p-4">Detalles</th>
              <th className="p-4">Usuario</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {activosFiltrados.map((activo) => (
              <tr key={activo._id} className="hover:bg-slate-700/50 transition-colors text-slate-300">
                <td className="p-4">
                  <div className="font-bold text-white">{activo.marca} {activo.modelo}</div>
                  <div className="text-xs text-blue-400 font-mono">{activo.serialNumber}</div>
                  <div className="text-xs text-slate-500 mt-1">{activo.tipo?.nombre}</div>
                </td>
                <td className="p-4 text-xs">
                  {activo.detallesTecnicos && Object.entries(activo.detallesTecnicos).map(([key, value]) => (
                    <div key={key}><span className="text-slate-500">{key}:</span> {value}</div>
                  ))}
                </td>
                <td className="p-4">
                  {activo.usuarioAsignado ? (
                    <div className="flex items-center gap-2 text-white">
                      <div className="bg-blue-600 p-1 rounded-full"><User size={12}/></div>
                      {activo.usuarioAsignado.nombre} {activo.usuarioAsignado.apellido}
                    </div>
                  ) : (
                    <span className="text-slate-600 italic">-- Libre --</span>
                  )}
                </td>
                <td className="p-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold border ${
                      activo.estado === 'Disponible' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      activo.estado === 'Asignado' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {activo.estado}
                    </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => prepararEdicion(activo)} className="p-2 hover:bg-slate-600 rounded text-blue-400 transition-colors">
                    <Pencil size={18}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assets;
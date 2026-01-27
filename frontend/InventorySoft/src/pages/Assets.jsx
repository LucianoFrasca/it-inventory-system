import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import readXlsxFile from 'read-excel-file';
import * as XLSX from 'xlsx'; 
import { 
  Plus, Search, Package, Pencil, Trash2, CheckSquare, Square, 
  Download, Upload, Check, Filter, ArrowLeft, X, Save, User,
  Laptop, Smartphone, Monitor, Tablet, MousePointer2, HardDrive, Cpu
} from 'lucide-react';

const Assets = () => {
  const [viewMode, setViewMode] = useState('dashboard'); 
  const [selectedType, setSelectedType] = useState(null);
  const [activos, setActivos] = useState([]);
  const [tiposActivos, setTiposActivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // UI & Filters
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
  const [activeFilters, setActiveFilters] = useState({}); 
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [ultimoSeleccionado, setUltimoSeleccionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);

  // Import
  const [modoImportar, setModoImportar] = useState(false);
  const [archivoData, setArchivoData] = useState([]);
  const [headersExcel, setHeadersExcel] = useState([]);
  const [mapeo, setMapeo] = useState({});
  const [procesando, setProcesando] = useState(false);

  // Form
  const [nuevoActivo, setNuevoActivo] = useState({ marca: '', modelo: '', serialNumber: '', estado: 'Disponible', tipo: '', usuarioAsignado: '' });
  const [detallesDinamicos, setDetallesDinamicos] = useState({});
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  // LIMPIEZA DE ESTADO AL CAMBIAR DE VISTA O NAVEGAR
  useEffect(() => {
    if (viewMode === 'dashboard') {
      resetEstadosFormulario();
    }
  }, [viewMode]);

  const resetEstadosFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    setIdEdicion(null);
    setNuevoActivo({ marca: '', modelo: '', serialNumber: '', estado: 'Disponible', tipo: selectedType?._id || '', usuarioAsignado: '' });
    setDetallesDinamicos({});
    setUserSearchTerm('');
  };

  const cargarDatos = async () => {
    try {
      const [resA, resT, resU] = await Promise.all([
        axios.get('http://localhost:5000/api/assets'),
        axios.get('http://localhost:5000/api/asset-types'),
        axios.get('http://localhost:5000/api/users')
      ]);
      setActivos(resA.data);
      setTiposActivos(resT.data);
      setUsuarios(resU.data);
    } catch (e) { console.error(e); }
  };

  // LÓGICA DE ICONOS SEGÚN TIPO
  const getIconForType = (typeName) => {
    const name = typeName?.toLowerCase() || '';
    if (name.includes('laptop') || name.includes('notebook')) return <Laptop size={18} className="text-blue-400" />;
    if (name.includes('celular') || name.includes('telefono') || name.includes('mobile')) return <Smartphone size={18} className="text-green-400" />;
    if (name.includes('monitor') || name.includes('pantalla')) return <Monitor size={18} className="text-purple-400" />;
    if (name.includes('tablet') || name.includes('ipad')) return <Tablet size={18} className="text-orange-400" />;
    if (name.includes('mouse') || name.includes('periferico')) return <MousePointer2 size={18} className="text-slate-400" />;
    if (name.includes('disco') || name.includes('ssd') || name.includes('hdd')) return <HardDrive size={18} className="text-red-400" />;
    return <Package size={18} className="text-slate-500" />;
  };

  const handleInputChange = (campo, valor) => {
    const root = { 'Marca': 'marca', 'Modelo': 'modelo', 'Serial Number': 'serialNumber', 'Estado': 'estado' };
    if (root[campo.nombreEtiqueta]) setNuevoActivo(prev => ({ ...prev, [root[campo.nombreEtiqueta]]: valor }));
    else if (campo.tipoDato === 'usuario_search' || campo.nombreEtiqueta === 'Usuario Asignado') setNuevoActivo(prev => ({ ...prev, usuarioAsignado: valor }));
    else setDetallesDinamicos(prev => ({ ...prev, [campo.nombreEtiqueta]: valor }));
  };

  const getVal = (campo, a = null) => {
    const d = a || nuevoActivo;
    if (campo.nombreEtiqueta === 'Marca') return d.marca;
    if (campo.nombreEtiqueta === 'Modelo') return d.modelo;
    if (campo.nombreEtiqueta === 'Serial Number') return d.serialNumber;
    if (campo.nombreEtiqueta === 'Estado') return d.estado;
    if (campo.tipoDato === 'usuario_search' || campo.nombreEtiqueta === 'Usuario Asignado') return d.usuarioAsignado;
    return (a ? a.detallesTecnicos?.[campo.nombreEtiqueta] : detallesDinamicos[campo.nombreEtiqueta]) || '';
  };

  const prepararEdicion = (a) => {
    setIdEdicion(a._id);
    setModoEdicion(true);
    setNuevoActivo({
      marca: a.marca || '',
      modelo: a.modelo || '',
      serialNumber: a.serialNumber || '',
      estado: a.estado || 'Disponible',
      tipo: a.tipo?._id || selectedType?._id,
      usuarioAsignado: a.usuarioAsignado?._id || ''
    });
    setDetallesDinamicos(a.detallesTecnicos || {});
    if (a.usuarioAsignado) setUserSearchTerm(`${a.usuarioAsignado.nombre} ${a.usuarioAsignado.apellido}`);
    else setUserSearchTerm('');
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...nuevoActivo, usuarioAsignado: nuevoActivo.usuarioAsignado || null, detallesTecnicos: detallesDinamicos };
    try {
      if (modoEdicion) await axios.put(`http://localhost:5000/api/assets/${idEdicion}`, body);
      else await axios.post('http://localhost:5000/api/assets', body);
      resetEstadosFormulario();
      cargarDatos();
    } catch (e) { alert("Error al guardar"); }
  };

  const baseAssets = useMemo(() => selectedType ? activos.filter(a => a.tipo?._id === selectedType._id) : [], [activos, selectedType]);

  const activosFiltrados = useMemo(() => {
    return baseAssets.filter(a => {
      const nombreUsuario = a.usuarioAsignado ? `${a.usuarioAsignado.nombre} ${a.usuarioAsignado.apellido}` : 'Sin Asignar';
      const rowContent = `${a.marca} ${a.modelo} ${a.serialNumber} ${nombreUsuario} ${JSON.stringify(a.detallesTecnicos)}`.toLowerCase();
      if (busquedaGlobal && !rowContent.includes(busquedaGlobal.toLowerCase())) return false;
      for (const colKey in activeFilters) {
        const selectedValues = activeFilters[colKey];
        if (selectedValues.length === 0) return false; 
        let val = (colKey === 'Marca' ? a.marca : colKey === 'Modelo' ? a.modelo : colKey === 'Serial Number' ? a.serialNumber : colKey === 'Estado' ? a.estado : colKey === 'Usuario Asignado' ? nombreUsuario : a.detallesTecnicos?.[colKey]) || '(Vacío)';
        if (!selectedValues.includes(val)) return false;
      }
      return true;
    });
  }, [baseAssets, busquedaGlobal, activeFilters]);

  const FilterDropdown = ({ colKey }) => {
    const uniqueValues = useMemo(() => {
        const vals = baseAssets.map(a => {
            if (colKey === 'Marca') return a.marca;
            if (colKey === 'Modelo') return a.modelo;
            if (colKey === 'Serial Number') return a.serialNumber;
            if (colKey === 'Estado') return a.estado;
            if (colKey === 'Usuario Asignado') return a.usuarioAsignado ? `${a.usuarioAsignado.nombre} ${a.usuarioAsignado.apellido}` : 'Sin Asignar';
            return a.detallesTecnicos?.[colKey] || '(Vacío)';
        });
        return [...new Set(vals)].filter(Boolean).sort();
    }, [baseAssets, colKey]);
    const selected = activeFilters[colKey] || uniqueValues;
    const [term, setTerm] = useState('');
    const toggleAll = () => {
        if (selected.length === uniqueValues.length) setActiveFilters({ ...activeFilters, [colKey]: [] });
        else setActiveFilters({ ...activeFilters, [colKey]: uniqueValues });
    };
    const toggleItem = (val) => {
        const newSelection = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val];
        setActiveFilters({ ...activeFilters, [colKey]: newSelection });
    };
    return (
      <div className="relative filter-container inline-block ml-2">
        <Filter size={14} className={`cursor-pointer ${activeFilters[colKey] ? 'text-blue-500 fill-blue-500' : 'text-slate-500'}`} onClick={(e) => { e.stopPropagation(); setOpenFilterColumn(openFilterColumn === colKey ? null : colKey); }}/>
        {openFilterColumn === colKey && (
          <div className="absolute top-6 left-0 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 w-64 p-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-1 mb-2">
              <Search size={12} className="mx-1 text-slate-500"/><input className="bg-transparent text-xs text-white outline-none w-full" placeholder="Buscar..." value={term} onChange={e => setTerm(e.target.value)} autoFocus/>
            </div>
            <label className="flex items-center gap-2 p-1 hover:bg-slate-700 cursor-pointer border-b border-slate-700 mb-1">
              <input type="checkbox" checked={selected.length === uniqueValues.length} onChange={toggleAll} className="accent-blue-500"/>
              <span className="text-xs font-bold text-white">(Seleccionar Todo)</span>
            </label>
            <div className="max-h-40 overflow-y-auto">
              {uniqueValues.filter(v => String(v).toLowerCase().includes(term.toLowerCase())).map(v => (
                <label key={v} className="flex items-center gap-2 p-1 hover:bg-slate-700 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(v)} onChange={() => toggleItem(v)} className="accent-blue-500"/>
                  <span className="text-xs text-slate-300 truncate">{v}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const UserSearchInput = ({ value, onChange }) => {
    const selectedUser = usuarios.find(u => u._id === value);
    const suggestions = usuarios.filter(u => (u.nombre + ' ' + u.apellido + ' ' + u.email).toLowerCase().includes(userSearchTerm.toLowerCase())).slice(0, 5);
    return (
      <div className="relative">
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-3 focus-within:border-blue-500">
          <Search size={16} className="text-slate-500 mr-2"/>
          <input className="bg-transparent outline-none text-white text-sm w-full" placeholder="Escribir nombre..." value={selectedUser && !showUserSuggestions ? `${selectedUser.nombre} ${selectedUser.apellido}` : userSearchTerm} onChange={e => { setUserSearchTerm(e.target.value); setShowUserSuggestions(true); }} onBlur={() => setTimeout(() => setShowUserSuggestions(false), 200)}/>
        </div>
        {showUserSuggestions && userSearchTerm && (
          <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-xl z-50">
            {suggestions.map(u => (
              <div key={u._id} className="p-3 hover:bg-blue-600/20 cursor-pointer text-sm" onMouseDown={() => { onChange(u._id); setUserSearchTerm(`${u.nombre} ${u.apellido}`); setShowUserSuggestions(false); }}>
                {u.nombre} {u.apellido} <span className="text-slate-500 text-xs">- {u.email}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleSelectOne = (id, i, e) => {
    let n = [...seleccionados];
    if(e.shiftKey && ultimoSeleccionado !== null) {
      const start=Math.min(ultimoSeleccionado, i), end=Math.max(ultimoSeleccionado, i);
      const ids = activosFiltrados.slice(start, end+1).map(x=>x._id);
      setSeleccionados(Array.from(new Set([...n, ...ids])));
    } else {
      setSeleccionados(n.includes(id) ? n.filter(x=>x!==id) : [...n, id]);
      setUltimoSeleccionado(i);
    }
  };

  return (
    <div className="p-8 pb-24 text-slate-200">
      {viewMode === 'dashboard' ? (
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold flex gap-3 mb-8"><Package className="text-blue-500"/> Activos IT</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiposActivos.map(t => (
              <div key={t._id} onClick={() => handleCardClick(t)} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer shadow-lg group transition-all hover:-translate-y-1">
                <div className="flex justify-between mb-4"><div className="p-3 bg-blue-900/20 text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">{getIconForType(t.nombre)}</div><span className="text-2xl font-bold">{activos.filter(a=>a.tipo?._id===t._id).length}</span></div>
                <h3 className="font-bold text-lg">{t.nombre}</h3>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4"><button onClick={handleBackToDashboard} className="p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"><ArrowLeft/></button><h1 className="text-2xl font-bold">{selectedType.nombre}</h1></div>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-500" size={16}/><input className="bg-slate-800 border border-slate-700 p-2 pl-9 rounded text-sm w-64 outline-none focus:border-blue-500 transition-all" placeholder="Buscar..." value={busquedaGlobal} onChange={e=>setBusquedaGlobal(e.target.value)}/></div>
              <button onClick={() => {
                const data = activosFiltrados.map(a => ({ Marca: a.marca, Modelo: a.modelo, 'S/N': a.serialNumber, Usuario: a.usuarioAsignado ? `${a.usuarioAsignado.nombre} ${a.usuarioAsignado.apellido}` : 'Libre', Estado: a.estado, ...a.detallesTecnicos }));
                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Activos");
                XLSX.writeFile(wb, `Inv_${selectedType.nombre}.xlsx`);
              }} className="bg-slate-800 border border-slate-700 p-2 rounded hover:bg-slate-700 hover:text-blue-400 transition-all" title="Exportar Excel"><Download size={18}/></button>
              <button onClick={() => mostrarFormulario ? resetEstadosFormulario() : prepararCreacion()} className={`px-4 py-2 rounded font-bold text-white transition-all ${mostrarFormulario ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{mostrarFormulario ? 'Cancelar' : 'Nuevo'}</button>
            </div>
          </div>

          {mostrarFormulario && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8 shadow-2xl animate-fade-in">
              <h2 className="text-lg font-bold mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">{modoEdicion ? <Pencil size={20} className="text-blue-500"/> : <Plus size={20} className="text-green-500"/>} {modoEdicion ? 'Editar' : 'Registrar'} {selectedType.nombre}</h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedType.campos.map(c => (
                    <div key={c.nombreEtiqueta}>
                      <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">{c.nombreEtiqueta}</label>
                      {c.tipoDato === 'usuario_search' ? <UserSearchInput value={nuevoActivo.usuarioAsignado} onChange={id => handleInputChange(c, id)}/> : 
                       c.tipoDato === 'dropdown' ? (
                        <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-sm outline-none focus:border-blue-500" value={getVal(c)} onChange={e => handleInputChange(c, e.target.value)}>
                          <option value="">-- Seleccionar --</option>
                          {c.opciones?.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                       ) : <input className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-sm outline-none focus:border-blue-500" type={c.tipoDato === 'number' ? 'number' : c.tipoDato === 'date' ? 'date' : 'text'} value={getVal(c)} onChange={e => handleInputChange(c, e.target.value)} required={['Marca','Modelo','Serial Number'].includes(c.nombreEtiqueta)}/>}
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all shadow-lg shadow-blue-900/20"><Save size={18}/> Guardar</button>
              </form>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-visible shadow-xl min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 z-20">
                <tr>
                  <th className="p-4 w-12 border-b border-slate-700"><button onClick={handleSelectAll}><CheckSquare size={18} className={seleccionados.length > 0 && seleccionados.length === activosFiltrados.length ? "text-blue-500" : "text-slate-600"}/></button></th>
                  <th className="p-4 w-10 border-b border-slate-700"></th> {/* Nueva columna para el Icono */}
                  {selectedType.campos.map(c => (
                    <th key={c.nombreEtiqueta} className="p-4 border-b border-slate-700 text-blue-300">
                      <div className="flex items-center">{c.nombreEtiqueta} <FilterDropdown colKey={c.nombreEtiqueta}/></div>
                    </th>
                  ))}
                  <th className="p-4 border-b border-slate-700 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {activosFiltrados.map((a, i) => (
                  <tr key={a._id} className={`group hover:bg-slate-700/30 ${seleccionados.includes(a._id) ? 'bg-blue-900/20' : ''} transition-colors`}>
                    <td className="p-4 text-center"><button onClick={(e) => handleSelectOne(a._id, i, e)}><CheckSquare size={18} className={seleccionados.includes(a._id) ? "text-blue-500" : "text-slate-600"}/></button></td>
                    <td className="p-4">{getIconForType(selectedType.nombre)}</td> {/* Celda del Icono */}
                    {selectedType.campos.map(c => {
                      const val = getVal(c, a);
                      const display = (c.nombreEtiqueta === 'Usuario Asignado' && a.usuarioAsignado) ? `${a.usuarioAsignado.nombre} ${a.usuarioAsignado.apellido}` : (val || '-');
                      if (c.nombreEtiqueta === 'Estado') return (
                        <td key={c.nombreEtiqueta} className="p-4">
                          <select value={a.estado} onChange={e => axios.put(`http://localhost:5000/api/assets/${a._id}`, { estado: e.target.value }).then(cargarDatos)} className={`bg-transparent border rounded px-1 text-[10px] font-bold outline-none cursor-pointer ${a.estado === 'Disponible' ? 'text-green-400 border-green-500/20' : a.estado === 'Asignado' ? 'text-blue-400 border-blue-500/20' : 'text-yellow-400 border-yellow-500/20'}`}>
                            <option value="Disponible" className="bg-slate-800">Disponible</option><option value="Asignado" className="bg-slate-800">Asignado</option><option value="Reparación" className="bg-slate-800">Reparación</option><option value="Baja" className="bg-slate-800">Baja</option>
                          </select>
                        </td>
                      );
                      return <td key={c.nombreEtiqueta} className="p-4 text-xs">{display}</td>;
                    })}
                    <td className="p-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => prepararEdicion(a)} className="text-blue-400 p-1 hover:bg-slate-700 rounded transition-all"><Pencil size={16}/></button>
                      <button onClick={() => { if(window.confirm('¿Borrar?')) axios.delete(`http://localhost:5000/api/assets/${a._id}`).then(cargarDatos); }} className="text-red-400 p-1 hover:bg-slate-700 rounded transition-all"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {seleccionados.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-full flex gap-6 z-50 shadow-2xl items-center animate-bounce-in">
              <span className="font-bold">{seleccionados.length} Seleccionados</span>
              <button onClick={() => { if(window.confirm(`¿Borrar ${seleccionados.length} activos?`)) axios.post('http://localhost:5000/api/assets/bulk-delete', { ids: seleccionados }).then(() => { setSeleccionados([]); cargarDatos(); }); }} className="bg-red-500 hover:bg-red-400 px-4 py-1.5 rounded-full font-bold text-sm transition-all shadow-md">Eliminar Todo</button>
              <button onClick={() => setSeleccionados([])} className="hover:rotate-90 transition-all"><X/></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Assets;
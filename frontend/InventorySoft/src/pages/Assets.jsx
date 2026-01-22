import { useState, useEffect } from 'react';
import axios from 'axios';
import readXlsxFile from 'read-excel-file';
import { 
  Plus, Search, Package, Laptop, Smartphone, Monitor, Grid, X, 
  Save, Pencil, Trash2, User, CheckSquare, Square, AlertCircle, 
  Download, Upload, Check, Filter, Eye
} from 'lucide-react';

const Assets = () => {
  // --- ESTADOS DE DATOS ---
  const [activos, setActivos] = useState([]);
  const [tiposActivos, setTiposActivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // --- ESTADOS DE UI ---
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  
  // --- SELECCIÓN ---
  const [seleccionados, setSeleccionados] = useState([]);
  const [ultimoSeleccionado, setUltimoSeleccionado] = useState(null);

  // --- FILTROS POR COLUMNA ---
  const [filtros, setFiltros] = useState({
    global: '', marcaModelo: '', serial: '', usuario: '', estado: '', tipo: ''
  });

  // --- VISIBILIDAD DE COLUMNAS ---
  const [cols, setCols] = useState({
    tipo: true, marca: true, serial: true, detalles: true, usuario: true, estado: true
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // --- IMPORTACIÓN ---
  const [modoImportar, setModoImportar] = useState(false);
  const [archivoData, setArchivoData] = useState([]);
  const [headersExcel, setHeadersExcel] = useState([]);
  const [mapeo, setMapeo] = useState({});
  const [tipoParaImportar, setTipoParaImportar] = useState('');
  const [procesando, setProcesando] = useState(false);

  // --- FORMULARIO ---
  const [nuevoActivo, setNuevoActivo] = useState({ 
    marca: '', modelo: '', serialNumber: '', estado: 'Disponible', tipo: '', usuarioAsignado: '' 
  });
  const [detallesDinamicos, setDetallesDinamicos] = useState({});
  const [tipoSeleccionadoObj, setTipoSeleccionadoObj] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

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

  // --- LÓGICA DE FILTRADO (Excel Style) ---
  const activosFiltrados = activos.filter(a => {
    const nombreCompleto = a.usuarioAsignado ? `${a.usuarioAsignado.nombre} ${a.usuarioAsignado.apellido}`.toLowerCase() : '';
    const marcaMod = `${a.marca} ${a.modelo}`.toLowerCase();
    const serial = a.serialNumber.toLowerCase();
    const tipo = a.tipo?.nombre?.toLowerCase() || '';
    
    // Filtro Global
    const matchGlobal = filtros.global === '' || marcaMod.includes(filtros.global.toLowerCase()) || serial.includes(filtros.global.toLowerCase()) || nombreCompleto.includes(filtros.global.toLowerCase());

    // Filtros por Columna
    const matchMarca = filtros.marcaModelo === '' || marcaMod.includes(filtros.marcaModelo.toLowerCase());
    const matchSerial = filtros.serial === '' || serial.includes(filtros.serial.toLowerCase());
    const matchUsuario = filtros.usuario === '' || nombreCompleto.includes(filtros.usuario.toLowerCase());
    const matchTipo = filtros.tipo === '' || tipo.includes(filtros.tipo.toLowerCase());
    const matchEstado = filtros.estado === '' || a.estado === filtros.estado;

    return matchGlobal && matchMarca && matchSerial && matchUsuario && matchTipo && matchEstado;
  });

  // --- ACCIONES (Selección, Eliminar, Editar) ---
  
  // 1. SELECCIONAR UNO (Shift + Click)
  const handleSelectOne = (id, index, e) => {
    let nuevos = [...seleccionados];
    if (e.shiftKey && ultimoSeleccionado !== null) {
      const start = Math.min(ultimoSeleccionado, index), end = Math.max(ultimoSeleccionado, index);
      const idsRango = activosFiltrados.slice(start, end + 1).map(a => a._id);
      setSeleccionados(Array.from(new Set([...nuevos, ...idsRango])));
    } else {
      setSeleccionados(nuevos.includes(id) ? nuevos.filter(i => i !== id) : [...nuevos, id]);
      setUltimoSeleccionado(index);
    }
  };

  // 2. SELECCIONAR TODOS (Sobre los filtrados)
  const handleSelectAll = () => {
    // Si ya están todos los visibles seleccionados, deseleccionamos. Si no, seleccionamos todos.
    const todosVisiblesSeleccionados = activosFiltrados.length > 0 && activosFiltrados.every(a => seleccionados.includes(a._id));
    
    if (todosVisiblesSeleccionados) {
      setSeleccionados([]);
    } else {
      setSeleccionados(activosFiltrados.map(a => a._id));
    }
  };

  // 3. ELIMINAR INDIVIDUAL
  const eliminarIndividual = async (id) => {
    if (!window.confirm("¿Eliminar este activo permanentemente?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/assets/${id}`);
      cargarDatos();
    } catch (e) { alert("Error al eliminar"); }
  };

  // 4. ELIMINAR MASIVO
  const eliminarMasivo = async () => {
    if (!window.confirm(`¿Eliminar ${seleccionados.length} activos?`)) return;
    try {
      await axios.post('http://localhost:5000/api/assets/bulk-delete', { ids: seleccionados });
      setSeleccionados([]);
      cargarDatos();
    } catch (e) { alert("Error masivo"); }
  };

  // 5. PREPARAR EDICIÓN
  const prepararEdicion = (a) => {
    setModoEdicion(true);
    setIdEdicion(a._id);
    setNuevoActivo({
      marca: a.marca, modelo: a.modelo, serialNumber: a.serialNumber,
      estado: a.estado, tipo: a.tipo?._id, usuarioAsignado: a.usuarioAsignado?._id || ''
    });
    setDetallesDinamicos(a.detallesTecnicos || {});
    setTipoSeleccionadoObj(tiposActivos.find(t => t._id === a.tipo?._id));
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir al formulario
  };

  const handleTipoChange = (e) => {
    const tId = e.target.value;
    const tObj = tiposActivos.find(t => t._id === tId);
    setNuevoActivo({ ...nuevoActivo, tipo: tId });
    setTipoSeleccionadoObj(tObj || null);
    setDetallesDinamicos({}); // Reset campos
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...nuevoActivo, usuarioAsignado: nuevoActivo.usuarioAsignado || null, detallesTecnicos: detallesDinamicos };
    try {
      if (modoEdicion) await axios.put(`http://localhost:5000/api/assets/${idEdicion}`, body);
      else await axios.post('http://localhost:5000/api/assets', body);
      setMostrarFormulario(false); setModoEdicion(false); setNuevoActivo({marca:'', modelo:'', serialNumber:'', estado:'Disponible', tipo:'', usuarioAsignado:''}); setDetallesDinamicos({});
      cargarDatos();
    } catch (e) { alert("Error guardando"); }
  };

  const handleQuickStatusChange = async (id, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:5000/api/assets/${id}`, { estado: nuevoEstado });
      cargarDatos();
    } catch (e) { alert("Error status"); }
  };

  // --- IMPORTACIÓN ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const rows = await readXlsxFile(file);
    setHeadersExcel(rows[0]); setArchivoData(rows.slice(1)); setModoImportar(true);
  };
  const finalizarImportacion = async () => {
    if (!tipoParaImportar) return alert("Selecciona tipo");
    setProcesando(true);
    const data = archivoData.map(row => { let obj={}; Object.keys(mapeo).forEach(k=>obj[mapeo[k]]=row[k]); return obj; });
    try { await axios.post('http://localhost:5000/api/assets/bulk-import', { tipoId: tipoParaImportar, activos: data }); setModoImportar(false); cargarDatos(); }
    catch(e) { alert("Error import"); } finally { setProcesando(false); }
  };

  return (
    <div className="p-8 pb-24 text-slate-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Package className="text-blue-500"/> Gestión de Activos</h1>
        <div className="flex gap-3">
          
          {/* BOTÓN COLUMNAS */}
          <div className="relative">
             <button onClick={() => setShowColMenu(!showColMenu)} className="bg-slate-800 border border-slate-700 p-2 rounded hover:bg-slate-700 flex items-center gap-2">
                <Eye size={18}/>
             </button>
             {showColMenu && (
               <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-3">
                  {Object.keys(cols).map(k => (
                    <label key={k} className="flex items-center gap-2 mb-2 cursor-pointer capitalize text-sm hover:text-white">
                      <input type="checkbox" checked={cols[k]} onChange={() => setCols({...cols, [k]: !cols[k]})} className="accent-blue-500"/> {k}
                    </label>
                  ))}
               </div>
             )}
          </div>

          {!modoImportar && !mostrarFormulario && (
            <div className="relative">
              <input type="file" accept=".xlsx" onChange={handleFileUpload} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium"><Upload size={18}/> Importar</button>
            </div>
          )}

          <button onClick={() => { if(mostrarFormulario) setModoEdicion(false); setMostrarFormulario(!mostrarFormulario); }} className={`px-4 py-2 rounded font-bold text-white shadow-lg ${mostrarFormulario ? 'bg-red-600' : 'bg-blue-600'}`}>
            {mostrarFormulario ? 'Cancelar' : 'Nuevo Activo'}
          </button>
        </div>
      </div>

      {/* FORMULARIO */}
      {mostrarFormulario && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8 shadow-2xl animate-fade-in">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            {modoEdicion ? <Pencil className="text-blue-400"/> : <Plus className="text-green-400"/>}
            {modoEdicion ? 'Editar Registro' : 'Nuevo Activo'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                 <label className="text-xs text-slate-500 uppercase font-bold">Tipo</label>
                 <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white" value={nuevoActivo.tipo} onChange={handleTipoChange} required>
                  <option value="">-- Seleccionar --</option>
                  {tiposActivos.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Marca" className="bg-slate-900 border border-slate-700 p-3 rounded text-white" value={nuevoActivo.marca} onChange={e => setNuevoActivo({...nuevoActivo, marca: e.target.value})} required />
                <input placeholder="Modelo" className="bg-slate-900 border border-slate-700 p-3 rounded text-white" value={nuevoActivo.modelo} onChange={e => setNuevoActivo({...nuevoActivo, modelo: e.target.value})} required />
              </div>
              <input placeholder="Serial Number (S/N)" className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white font-mono" value={nuevoActivo.serialNumber} onChange={e => setNuevoActivo({...nuevoActivo, serialNumber: e.target.value})} required />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase font-bold">Asignado a</label>
                <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white" value={nuevoActivo.usuarioAsignado} onChange={e => setNuevoActivo({...nuevoActivo, usuarioAsignado: e.target.value})}>
                  <option value="">-- Sin Asignar --</option>
                  {usuarios.map(u => <option key={u._id} value={u._id}>{u.nombre} {u.apellido} ({u.area})</option>)}
                </select>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 grid grid-cols-2 gap-3">
                {tipoSeleccionadoObj?.campos.length > 0 ? (
                    tipoSeleccionadoObj.campos.map(c => (
                      <div key={c.nombreEtiqueta}>
                        <label className="text-[10px] text-slate-400">{c.nombreEtiqueta}</label>
                        <input className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white text-sm" value={detallesDinamicos[c.nombreEtiqueta] || ''} onChange={e => setDetallesDinamicos({...detallesDinamicos, [c.nombreEtiqueta]: e.target.value})} />
                      </div>
                    ))
                ) : <p className="col-span-2 text-xs text-slate-500 italic">Selecciona un tipo para ver campos técnicos.</p>}
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* IMPORTADOR */}
      {modoImportar && (
        <div className="bg-slate-800 p-6 rounded-xl border-2 border-blue-600 mb-8">
            <div className="flex justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><Download/> Mapeo de Importación</h2><button onClick={() => setModoImportar(false)}><X/></button></div>
            <select className="bg-slate-900 text-white p-3 rounded border border-slate-700 mb-4 w-full" value={tipoParaImportar} onChange={(e) => { setTipoParaImportar(e.target.value); setMapeo({}); }}>
            <option value="">-- ¿Qué tipo estás importando? --</option>
            {tiposActivos.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
            </select>
            {tipoParaImportar && (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs mb-4">
                <thead><tr className="bg-slate-900">{headersExcel.map((h, i) => (<th key={i} className="p-2 min-w-[150px]"><select className="w-full bg-blue-600 text-white p-1 rounded mb-1" onChange={(e) => setMapeo({...mapeo, [i]: e.target.value})}><option value="">Ignorar</option><optgroup label="Fijos"><option value="marca">Marca</option><option value="modelo">Modelo</option><option value="serialNumber">S/N</option><option value="emailUsuario">Email Usuario</option></optgroup><optgroup label="Técnicos">{tiposActivos.find(t => t._id === tipoParaImportar)?.campos.map(c => <option key={c.nombreEtiqueta} value={c.nombreEtiqueta}>{c.nombreEtiqueta}</option>)}</optgroup></select><div className="text-slate-500">{h}</div></th>))}</tr></thead>
                </table>
                <button onClick={finalizarImportacion} disabled={procesando} className="w-full bg-green-600 text-white py-2 rounded font-bold">Confirmar e Importar</button>
            </div>
            )}
        </div>
      )}

      {/* BARRA BUSQUEDA GLOBAL */}
      <div className="mb-6 relative">
         <Search className="absolute left-4 top-3.5 text-slate-500" size={20}/>
         <input placeholder="Búsqueda Global..." className="w-full bg-slate-800 border border-slate-700 p-3.5 pl-12 rounded-xl outline-none focus:border-blue-500" value={filtros.global} onChange={e => setFiltros({...filtros, global: e.target.value})} />
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="p-4 w-12 text-center border-b border-slate-700">
                    {/* SELECCIONAR TODOS: BOTÓN CORREGIDO */}
                    <button onClick={handleSelectAll}>
                        {activosFiltrados.length > 0 && seleccionados.length > 0 && activosFiltrados.every(a => seleccionados.includes(a._id)) 
                            ? <CheckSquare size={18} className="text-blue-500"/> 
                            : <Square size={18}/>}
                    </button>
                </th>
                
                {cols.tipo && <th className="p-4 border-b border-slate-700 min-w-[140px]">
                   <div className="flex flex-col gap-2"><span>Tipo</span><input className="bg-slate-800 border border-slate-700 p-1 rounded font-normal text-white lowercase" placeholder="Filtro..." value={filtros.tipo} onChange={e => setFiltros({...filtros, tipo: e.target.value})}/></div>
                </th>}

                {cols.marca && <th className="p-4 border-b border-slate-700 min-w-[180px]">
                   <div className="flex flex-col gap-2"><span>Marca / Modelo</span><input className="bg-slate-800 border border-slate-700 p-1 rounded font-normal text-white" placeholder="Filtro..." value={filtros.marcaModelo} onChange={e => setFiltros({...filtros, marcaModelo: e.target.value})}/></div>
                </th>}

                {cols.serial && <th className="p-4 border-b border-slate-700">
                   <div className="flex flex-col gap-2"><span>S/N</span><input className="bg-slate-800 border border-slate-700 p-1 rounded font-normal text-white" placeholder="Filtro..." value={filtros.serial} onChange={e => setFiltros({...filtros, serial: e.target.value})}/></div>
                </th>}

                {cols.detalles && <th className="p-4 border-b border-slate-700">Specs</th>}

                {cols.usuario && <th className="p-4 border-b border-slate-700 min-w-[180px]">
                   <div className="flex flex-col gap-2"><span>Asignado a</span><input className="bg-slate-800 border border-slate-700 p-1 rounded font-normal text-white" placeholder="Nombre..." value={filtros.usuario} onChange={e => setFiltros({...filtros, usuario: e.target.value})}/></div>
                </th>}

                {cols.estado && <th className="p-4 border-b border-slate-700 min-w-[140px]">
                   <div className="flex flex-col gap-2"><span>Estado</span>
                   <select className="bg-slate-800 border border-slate-700 p-1 rounded font-normal text-white" value={filtros.estado} onChange={e => setFiltros({...filtros, estado: e.target.value})}><option value="">Todos</option><option value="Disponible">Disponible</option><option value="Asignado">Asignado</option><option value="Reparación">Reparación</option></select></div>
                </th>}
                <th className="p-4 border-b border-slate-700 text-right">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-700/50">
              {activosFiltrados.map((a, index) => {
                const isSelected = seleccionados.includes(a._id);
                return (
                  <tr key={a._id} className={`transition-colors group ${isSelected ? 'bg-blue-900/20' : 'hover:bg-slate-700/30'}`}>
                    <td className="p-4 text-center">
                        {/* SELECCIÓN INDIVIDUAL */}
                        <button onClick={(e) => handleSelectOne(a._id, index, e)}>
                            {isSelected ? <CheckSquare size={18} className="text-blue-500"/> : <Square size={18} className="text-slate-600"/>}
                        </button>
                    </td>

                    {cols.tipo && <td className="p-4"><span className="bg-slate-900 text-blue-400 px-2 py-1 rounded text-[10px] font-bold uppercase border border-blue-500/20">{a.tipo?.nombre}</span></td>}
                    {cols.marca && <td className="p-4"><div className="font-bold text-white">{a.marca}</div><div className="text-xs text-slate-500">{a.modelo}</div></td>}
                    {cols.serial && <td className="p-4 font-mono text-xs text-slate-400">{a.serialNumber}</td>}
                    
                    {cols.detalles && <td className="p-4 text-[10px] text-slate-400">
                        {Object.entries(a.detallesTecnicos || {}).map(([k,v]) => <div key={k}><span className="text-slate-600 uppercase">{k}:</span> {v}</div>)}
                    </td>}

                    {cols.usuario && <td className="p-4">
                        {a.usuarioAsignado ? (
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-white">{a.usuarioAsignado.nombre} {a.usuarioAsignado.apellido}</span>
                                <span className="text-[10px] text-slate-500 uppercase">{a.usuarioAsignado.area}</span>
                            </div>
                        ) : <span className="text-slate-600 italic text-xs">Sin asignar</span>}
                    </td>}

                    {cols.estado && <td className="p-4">
                        <select value={a.estado} onChange={(e) => handleQuickStatusChange(a._id, e.target.value)} className={`bg-transparent font-bold text-xs outline-none cursor-pointer border rounded px-2 py-1 ${a.estado === 'Disponible' ? 'text-green-400 border-green-400/20' : a.estado === 'Asignado' ? 'text-blue-400 border-blue-400/20' : 'text-yellow-400 border-yellow-400/20'}`}>
                            <option value="Disponible" className="bg-slate-800">Disponible</option><option value="Asignado" className="bg-slate-800">Asignado</option><option value="Reparación" className="bg-slate-800">Reparación</option><option value="Baja" className="bg-slate-800 text-red-400">Baja</option>
                        </select>
                    </td>}

                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => prepararEdicion(a)} className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg"><Pencil size={16}/></button>
                            <button onClick={() => eliminarIndividual(a._id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {activosFiltrados.length === 0 && <div className="p-12 text-center text-slate-500">No hay resultados.</div>}
        </div>
      </div>

      {/* BARRA FLOTANTE MASIVA */}
      {seleccionados.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-8 py-4 rounded-full flex gap-6 z-50 shadow-2xl items-center animate-bounce-in">
          <span className="font-bold flex items-center gap-2"><CheckSquare/> {seleccionados.length} Seleccionados</span>
          <button onClick={eliminarMasivo} className="bg-red-500 hover:bg-red-400 px-4 py-1.5 rounded-full font-bold text-sm transition-all">Eliminar Todo</button>
          <button onClick={() => setSeleccionados([])} className="hover:rotate-90 transition-all"><X/></button>
        </div>
      )}
    </div>
  );
};

export default Assets;
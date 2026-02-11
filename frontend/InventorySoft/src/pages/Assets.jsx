import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import readXlsxFile from 'read-excel-file';
import * as XLSX from 'xlsx'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Search, Package, Pencil, Trash2, CheckSquare, Square, 
  Download, Upload, Check, Filter, ArrowLeft, X, Save, User,
  Laptop, Smartphone, Monitor, Tablet, MousePointer2, HardDrive, Headphones, Cpu, Box, Share, AlertCircle
} from 'lucide-react';


const normalizarTexto = (texto) => {
    return texto ? String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
};

const UserSearchInput = ({ value, onChange, placeholder = "Buscar usuario...", usuarios, selectedUserId }) => {
    const [localTerm, setLocalTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        if (selectedUserId) {
            const u = usuarios.find(user => user._id === selectedUserId);
            if (u) setLocalTerm(`${u.nombre} ${u.apellido}`);
        } else if (!value) {
            setLocalTerm('');
        }
    }, [selectedUserId, usuarios, value]);

    const suggestions = usuarios.filter(u => {
        const nombreCompleto = `${u.nombre} ${u.apellido} ${u.email}`;
        return normalizarTexto(nombreCompleto).includes(normalizarTexto(localTerm));
    }).slice(0, 5);

    return (
      <div className="relative w-full">
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-3 focus-within:border-blue-500 transition-all">
          <Search size={16} className="text-slate-500 mr-2"/>
          <input 
            className="bg-transparent outline-none text-white text-sm w-full" 
            placeholder={placeholder} 
            value={localTerm} 
            onChange={e => { setLocalTerm(e.target.value); setShowSuggestions(true); onChange(''); }} 
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {value && <button type="button" onClick={() => {onChange(''); setLocalTerm('')}} className="text-slate-500 hover:text-white ml-2 transition-colors"><X size={14}/></button>}
        </div>
        {showSuggestions && localTerm && !value && (
          <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 rounded-lg mt-1 shadow-xl z-[150] max-h-48 overflow-y-auto animate-fade-in">
            {suggestions.map(u => (
                <div key={u._id} className="p-3 hover:bg-blue-600/20 cursor-pointer text-sm" onMouseDown={() => { onChange(u._id); setLocalTerm(`${u.nombre} ${u.apellido}`); setShowSuggestions(false); }}>
                    {u.nombre} {u.apellido}
                </div>
            ))}
          </div>
        )}
      </div>
    );
  };

const Assets = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true); 
  const [viewMode, setViewMode] = useState('dashboard'); 
  const [selectedType, setSelectedType] = useState(null);
  const [activos, setActivos] = useState([]);
  const [tiposActivos, setTiposActivos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // --- NUEVO: REGLAS EXTERNAS DEL DASHBOARD ---
  const [externalRules, setExternalRules] = useState([]); 

  // UI & Filtros
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
  const [activeFilters, setActiveFilters] = useState({}); 
  const [openFilterColumn, setOpenFilterColumn] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [ultimoSeleccionado, setUltimoSeleccionado] = useState(null);
  
  // Modales
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarAsignacionStock, setMostrarAsignacionStock] = useState(false);
  
  // Edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState({}); 

  // Stock
  const [stockItem, setStockItem] = useState(null); 
  const [asignacionData, setAsignacionData] = useState({ usuario: '', motivo: '', fecha: new Date().toISOString().split('T')[0] });

  // Import
  const [modoImportar, setModoImportar] = useState(false);
  const [archivoData, setArchivoData] = useState([]);
  const [headersExcel, setHeadersExcel] = useState([]);
  const [mapeo, setMapeo] = useState({});
  const [procesando, setProcesando] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  const cargarDatos = async () => {
    try {
      const [resA, resT, resU] = await Promise.all([
        axios.get('https://itsoft-backend.onrender.com/api/assets'),
        axios.get('https://itsoft-backend.onrender.com/api/asset-types'),
        axios.get('https://itsoft-backend.onrender.com/api/users')
      ]);
      setActivos(resA.data || []);
      setTiposActivos(resT.data || []);
      setUsuarios(resU.data || []);

      // 1. Detección de navegación desde Dashboard (Tipo + Reglas)
      if (location.state?.preSelectedTypeId) {
          const tipoEncontrado = resT.data.find(t => t._id === location.state.preSelectedTypeId);
          if (tipoEncontrado) {
              setSelectedType(tipoEncontrado);
              setViewMode('list');
              
              // Si vienen reglas personalizadas, las aplicamos
              if (location.state.customRules) {
                  setExternalRules(location.state.customRules);
              }
              
              // Limpiamos historial
              window.history.replaceState({}, document.title);
          }
      }

    } catch (e) { console.error("Error cargando datos:", e); } 
    finally { setLoading(false); } 
  };

  // --- LÓGICA DE FILTRADO AVANZADO (Copia adaptada del Dashboard) ---
  const obtenerValor = (activo, campoKey) => {
      if (campoKey === 'usuario') return activo.usuarioAsignado ? `${activo.usuarioAsignado.nombre} ${activo.usuarioAsignado.apellido}` : '';
      if (campoKey.startsWith('dt_')) {
          const keyReal = campoKey.replace('dt_', '');
          return activo.detallesTecnicos?.[keyReal] || '';
      }
      return activo[campoKey] || '';
  };

  const cumpleReglasExternas = (activo) => {
      if (externalRules.length === 0) return true;
      return externalRules.every(regla => {
          const valorReal = String(obtenerValor(activo, regla.campo)).toLowerCase();
          const valorFiltro = String(regla.valor).toLowerCase();

          switch (regla.operador) {
              case 'contiene': return valorReal.includes(valorFiltro);
              case 'igual': return valorReal === valorFiltro;
              case 'no_contiene': return !valorReal.includes(valorFiltro);
              case 'mayor': return parseFloat(valorReal) > parseFloat(valorFiltro);
              case 'menor': return parseFloat(valorReal) < parseFloat(valorFiltro);
              case 'fecha_mayor': return valorReal > valorFiltro;
              case 'fecha_menor': return valorReal < valorFiltro;
              default: return true;
          }
      });
  };

  const prepararCreacion = () => {
    setModoEdicion(false);
    setIdEdicion(null);
    setDatosFormulario({}); 
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prepararEdicion = (a) => {
    setIdEdicion(a._id);
    setModoEdicion(true);
    
    const datosPrellenos = {};
    if (a.marca) datosPrellenos['Marca'] = a.marca;
    if (a.modelo) datosPrellenos['Modelo'] = a.modelo;
    if (a.serialNumber) datosPrellenos['Serial Number'] = a.serialNumber;
    if (a.estado) datosPrellenos['Estado'] = a.estado;
    if (a.usuarioAsignado) datosPrellenos['Usuario Asignado'] = a.usuarioAsignado._id;

    if (a.detallesTecnicos) {
        Object.keys(a.detallesTecnicos).forEach(k => datosPrellenos[k] = a.detallesTecnicos[k]);
    }

    selectedType.campos.forEach(c => {
        const etiqueta = c.nombreEtiqueta;
        if (datosPrellenos[etiqueta] === undefined) {
            const keyRaiz = Object.keys(a).find(k => k.toLowerCase() === etiqueta.toLowerCase());
            if (keyRaiz) datosPrellenos[etiqueta] = a[keyRaiz];
            if (a.detallesTecnicos) {
                const keyDetalle = Object.keys(a.detallesTecnicos).find(k => k.toLowerCase() === etiqueta.toLowerCase());
                if (keyDetalle) datosPrellenos[etiqueta] = a.detallesTecnicos[keyDetalle];
            }
        }
    });

    setDatosFormulario(datosPrellenos);
    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModalStockGeneral = () => {
      setStockItem(null); 
      setAsignacionData({ usuario: '', motivo: '', fecha: new Date().toISOString().split('T')[0] });
      setMostrarAsignacionStock(true);
  };

  const prepararAsignacionStockIndividual = (activo) => {
    setStockItem(activo);
    setAsignacionData({ usuario: '', motivo: '', fecha: new Date().toISOString().split('T')[0] });
    setMostrarAsignacionStock(true);
  };

  const handleStockAssignment = async () => {
    if (!stockItem) return alert("Debes seleccionar un modelo.");
    if (!asignacionData.usuario) return alert("Selecciona un usuario.");
    
    try {
      const nuevoActivoUsuario = {
        tipo: stockItem.tipo._id || stockItem.tipo,
        marca: stockItem.marca,
        modelo: stockItem.modelo,
        serialNumber: 'ASG-' + Date.now().toString().slice(-6), 
        estado: 'Asignado',
        usuarioAsignado: asignacionData.usuario,
        detallesTecnicos: {
            ...stockItem.detallesTecnicos,
            'Motivo Asignación': asignacionData.motivo,
            'Fecha Asignación': asignacionData.fecha
        }
      };
      await axios.post('https://itsoft-backend.onrender.com/api/assets', nuevoActivoUsuario);

      const stockActual = parseInt(stockItem.detallesTecnicos['Stock'] || 0);
      const nuevoStock = Math.max(0, stockActual - 1);
      
      await axios.put(`https://itsoft-backend.onrender.com/api/assets/${stockItem._id}`, {
          detallesTecnicos: { ...stockItem.detallesTecnicos, 'Stock': nuevoStock }
      });

      setMostrarAsignacionStock(false);
      cargarDatos();
      alert("Asignado correctamente.");
    } catch (e) { alert("Error: " + e.message); }
  };

  const baseAssets = useMemo(() => {
    if (!selectedType || !activos) return [];
    return activos.filter(a => {
        const esDelTipo = String(a.tipo?._id || a.tipo) === String(selectedType._id);
        const tieneStock = selectedType.campos.some(c => c.nombreEtiqueta === 'Stock');
        
        // Si hay reglas externas (filtros avanzados), NO ocultamos items asignados
        // para que el usuario pueda ver "qué usuario tiene X cosa"
        if (tieneStock && externalRules.length === 0) return esDelTipo && !a.usuarioAsignado;
        
        return esDelTipo;
    });
  }, [activos, selectedType, externalRules]);

  const activosFiltrados = useMemo(() => {
    return baseAssets.filter(a => {
      // 1. Filtro Reglas Externas (Dashboard)
      if (!cumpleReglasExternas(a)) return false;

      // 2. Filtro Busqueda Global
      const nombreUsuario = a.usuarioAsignado ? `${a.usuarioAsignado.nombre} ${a.usuarioAsignado.apellido}` : 'Sin Asignar';
      const content = `${a.marca || ''} ${a.modelo || ''} ${a.serialNumber || ''} ${nombreUsuario} ${JSON.stringify(a.detallesTecnicos || {})}`;
      
      if (busquedaGlobal && !normalizarTexto(content).includes(normalizarTexto(busquedaGlobal))) return false;

      // 3. Filtros Dropdown
      for (const colKey in activeFilters) {
        const filters = activeFilters[colKey];
        if (filters.length === 0) return false;
        const val = getFieldValue({ nombreEtiqueta: colKey }, a) || '(Vacío)';
        if (!filters.includes(val)) return false;
      }
      return true;
    });
  }, [baseAssets, busquedaGlobal, activeFilters, externalRules]);

  const modelosConStock = useMemo(() => {
    if (!selectedType) return [];
    return activos.filter(a => 
      String(a.tipo?._id || a.tipo) === String(selectedType._id) && 
      parseInt(a.detallesTecnicos?.['Stock'] || 0) > 0 && 
      !a.usuarioAsignado
    );
  }, [activos, selectedType]);

  const handleSelectOne = (id, i, e) => {
    let n = [...seleccionados];
    if (e.nativeEvent.shiftKey && ultimoSeleccionado !== null) {
      const start = Math.min(ultimoSeleccionado, i); const end = Math.max(ultimoSeleccionado, i);
      const idsRango = activosFiltrados.slice(start, end + 1).map(x => x._id);
      setSeleccionados(Array.from(new Set([...n, ...idsRango])));
    } else {
      if (n.includes(id)) n = n.filter(x => x !== id); else n.push(id);
      setSeleccionados(n); setUltimoSeleccionado(i);
    }
  };

  const handleBackToDashboard = () => {
    if (mostrarFormulario) setMostrarFormulario(false);
    else { setViewMode('dashboard'); setSelectedType(null); setModoImportar(false); setSeleccionados([]); setExternalRules([]); }
  };

  const getIcon = (name) => {
    const n = name?.toLowerCase() || '';
    if (n.includes('laptop')) return <Laptop size={20} />;
    if (n.includes('celular')) return <Smartphone size={20} />;
    if (n.includes('monitor')) return <Monitor size={20} />;
    if (n.includes('auricular')) return <Headphones size={20} />;
    if (n.includes('mouse')) return <MousePointer2 size={20} />;
    return <Package size={20} />;
  };

  const handleInputChange = (campo, valor) => setDatosFormulario(prev => ({ ...prev, [campo.nombreEtiqueta]: valor }));
  
  const getFieldValue = (campo, item = null) => {
    if (item) {
        if (campo.nombreEtiqueta === 'Usuario Asignado') {
            return item.usuarioAsignado ? `${item.usuarioAsignado.nombre} ${item.usuarioAsignado.apellido}` : '';
        }
        const camposRaiz = ['marca', 'modelo', 'serialNumber', 'estado'];
        const keyRaiz = camposRaiz.find(k => k.toLowerCase() === campo.nombreEtiqueta.toLowerCase().replace(' ', '')); 
        if (keyRaiz && item[keyRaiz]) return item[keyRaiz];

        if (item.detallesTecnicos) {
            if (item.detallesTecnicos[campo.nombreEtiqueta]) return item.detallesTecnicos[campo.nombreEtiqueta];
            const keyDetalle = Object.keys(item.detallesTecnicos).find(k => k.toLowerCase() === campo.nombreEtiqueta.toLowerCase());
            if (keyDetalle) return item.detallesTecnicos[keyDetalle];
        }
        return '';
    }
    return datosFormulario[campo.nombreEtiqueta] || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let serialFinal = datosFormulario['Serial Number'];
    if (!serialFinal || serialFinal.trim() === '') serialFinal = 'STK-' + Date.now().toString().slice(-8); 

    const findField = (name) => Object.keys(datosFormulario).find(k => k.toLowerCase() === name.toLowerCase());
    const marcaKey = findField('marca');
    const marcaFinal = marcaKey ? datosFormulario[marcaKey] : 'Genérico';
    const modeloKey = findField('modelo');
    const modeloFinal = modeloKey ? datosFormulario[modeloKey] : selectedType.nombre;

    const body = { 
        tipo: selectedType._id,
        usuarioAsignado: datosFormulario['Usuario Asignado'] || null, 
        estado: datosFormulario['Estado'] || 'Disponible',
        marca: marcaFinal,
        modelo: modeloFinal,
        serialNumber: serialFinal, 
        detallesTecnicos: { ...datosFormulario } 
    };

    try {
      if (modoEdicion) await axios.put(`https://itsoft-backend.onrender.com/api/assets/${idEdicion}`, body);
      else await axios.post('https://itsoft-backend.onrender.com/api/assets', body);
      setMostrarFormulario(false); cargarDatos();
    } catch (e) { alert("Error al guardar: " + (e.response?.data?.message || e.message)); }
  };

  const exportarExcel = () => {
    const data = activosFiltrados.map(a => {
        const fila = {};
        selectedType.campos.forEach(c => {
            fila[c.nombreEtiqueta] = getFieldValue(c, a);
        });
        return fila;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Activos");
    XLSX.writeFile(wb, `Inv_${selectedType?.nombre}.xlsx`);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const rows = await readXlsxFile(file);
    setHeadersExcel(rows[0]); setArchivoData(rows.slice(1)); setModoImportar(true);
  };

  const finalizarImportacion = async () => {
    setProcesando(true);
    const data = archivoData.map(row => {
      let obj = {};
      Object.keys(mapeo).forEach(idx => {
        const campoDestino = mapeo[idx];
        const alias = { 'Marca': 'marca', 'Modelo': 'modelo', 'Serial Number': 'serialNumber', 'Estado': 'estado', 'Usuario Asignado': 'emailUsuario' };
        obj[alias[campoDestino] || campoDestino] = row[idx];
      });
      return obj;
    });
    try {
      await axios.post('https://itsoft-backend.onrender.com/api/assets/bulk-import', { tipoId: selectedType._id, activos: data });
      setModoImportar(false); cargarDatos();
    } catch (e) { alert("Error importación"); } finally { setProcesando(false); }
  };

  const FilterDropdown = ({ colKey }) => {
    const uniqueValues = useMemo(() => {
      const vals = baseAssets.map(a => getFieldValue({ nombreEtiqueta: colKey }, a) || '(Vacío)');
      return [...new Set(vals)].filter(Boolean).sort();
    }, [baseAssets, colKey]);
    
    const selected = activeFilters[colKey] || uniqueValues;
    const [term, setTerm] = useState('');
    
    return (
      <div className="relative filter-container inline-block ml-2">
        <Filter size={14} className={`cursor-pointer transition-all ${activeFilters[colKey] && activeFilters[colKey].length !== uniqueValues.length ? 'text-blue-500 fill-blue-500' : 'text-slate-500 hover:text-white'}`} onClick={(e) => {e.stopPropagation(); setOpenFilterColumn(openFilterColumn === colKey ? null : colKey)}}/>
        {openFilterColumn === colKey && (
          <div className="absolute top-6 left-0 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-[100] w-64 p-3 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex bg-slate-900 border border-slate-700 rounded p-1 mb-2"><Search size={12} className="mx-1 text-slate-500"/><input className="bg-transparent text-xs text-white outline-none w-full" placeholder="Buscar..." value={term} onChange={e => setTerm(e.target.value)} autoFocus/></div>
            <label className="flex gap-2 p-1 hover:bg-slate-700 cursor-pointer border-b border-slate-700 mb-1"><input type="checkbox" checked={selected.length === uniqueValues.length} onChange={() => setActiveFilters({...activeFilters, [colKey]: selected.length === uniqueValues.length ? [] : uniqueValues})} className="accent-blue-500"/><span className="text-xs font-bold text-white">(Todos)</span></label>
            <div className="max-h-40 overflow-y-auto">{uniqueValues.filter(v => normalizarTexto(String(v)).includes(normalizarTexto(term))).map(v => (
              <label key={v} className="flex gap-2 p-1 hover:bg-slate-700 cursor-pointer"><input type="checkbox" checked={selected.includes(v)} onChange={() => setActiveFilters({...activeFilters, [colKey]: selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]})} className="accent-blue-500"/><span className="text-xs text-slate-300 truncate">{v}</span></label>
            ))}</div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-8 text-slate-500 italic">Cargando inventario...</div>;

  return (
    <div className="p-8 text-slate-200 animate-fade-in">
      {viewMode === 'dashboard' ? (
        <div className="animate-fade-in">
          <div className="mb-8 flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-all shadow-md"><ArrowLeft size={20}/></button>
             <h1 className="text-3xl font-bold flex gap-3"><Package className="text-blue-500"/> Activos IT</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* BOTÓN DE BAJAS */}
            <div onClick={() => navigate('/bajas')} className="bg-red-900/40 p-6 rounded-xl border border-red-800 hover:bg-red-900/60 cursor-pointer shadow-lg group transition-all hover:-translate-y-2 active:scale-95">
              <div className="flex justify-between mb-4"><div className="p-3 bg-red-500 text-white rounded-lg transition-transform group-hover:scale-110"><AlertCircle size={24}/></div></div>
              <h3 className="font-bold text-lg text-white">Historial de Bajas</h3>
              <p className="text-xs text-red-200 mt-1 uppercase tracking-wider font-medium">Activos descartados</p>
            </div>

            <div onClick={() => navigate('/asignaciones')} className="bg-blue-600 p-6 rounded-xl border border-blue-500 hover:bg-blue-500 cursor-pointer shadow-lg group transition-all hover:-translate-y-2 active:scale-95">
              <div className="flex justify-between mb-4"><div className="p-3 bg-white/20 text-white rounded-lg transition-transform group-hover:scale-110"><User size={24}/></div></div>
              <h3 className="font-bold text-lg text-white">Buscar por Usuario</h3>
              <p className="text-xs text-blue-100 mt-1 uppercase tracking-wider font-medium">Ver perfil y asignaciones</p>
            </div>
            
            {tiposActivos.map(t => (
              <div key={t._id} onClick={() => { setSelectedType(t); setViewMode('list'); setSeleccionados([]); }} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer shadow-lg group transition-all hover:-translate-y-2 active:scale-95">
                <div className="flex justify-between mb-4"><div className="p-3 bg-blue-900/20 text-blue-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">{getIcon(t.nombre)}</div><span className="text-2xl font-bold text-white">{activos.filter(a => String(a.tipo?._id || a.tipo) === String(t._id)).length}</span></div>
                <h3 className="font-bold text-lg text-white">{t.nombre}</h3>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <button onClick={handleBackToDashboard} className="p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-all shadow-md"><ArrowLeft size={20}/></button>
              <h1 className="text-2xl font-bold text-white">{selectedType?.nombre}</h1>
              {externalRules.length > 0 && (
                  <div className="flex items-center gap-2 bg-blue-900/40 border border-blue-500/50 px-3 py-1 rounded-full animate-fade-in">
                      <span className="text-xs text-blue-300 font-bold">⚠️ Filtro Activo: {externalRules.length} Reglas</span>
                      <button onClick={() => setExternalRules([])} className="text-blue-300 hover:text-white"><X size={14}/></button>
                  </div>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-500" size={16}/><input className="bg-slate-800 border border-slate-700 p-2 pl-9 rounded text-sm w-64 outline-none focus:border-blue-500 transition-all" placeholder="Buscar..." value={busquedaGlobal} onChange={e=>setBusquedaGlobal(e.target.value)}/></div>
              
              {selectedType?.campos.some(c => c.nombreEtiqueta === 'Stock') && (
                  <button onClick={abrirModalStockGeneral} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 font-bold transition-all shadow-md active:scale-95">
                    <Share size={18}/> Asignar Stock
                  </button>
              )}

              <button onClick={exportarExcel} className="bg-slate-800 border border-slate-700 p-2 rounded hover:bg-slate-700 hover:text-blue-400 transition-all shadow-md" title="Exportar Excel"><Download size={18}/></button>
              {!mostrarFormulario && !modoImportar && (
                <div className="relative">
                  <input type="file" accept=".xlsx" onChange={handleFileUpload} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                  <button className="bg-slate-800 border border-slate-700 p-2 rounded hover:bg-slate-700 hover:text-green-400 transition-all shadow-md"><Upload size={18}/></button>
                </div>
              )}
              <button onClick={() => mostrarFormulario ? setMostrarFormulario(false) : prepararCreacion()} className={`px-4 py-2 rounded font-bold text-white transition-all shadow-md active:scale-95 ${mostrarFormulario ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{mostrarFormulario ? 'Cancelar' : 'Nuevo'}</button>
            </div>
          </div>

          {mostrarFormulario && (
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8 shadow-2xl animate-fade-in">
              <h2 className="text-lg font-bold mb-6 border-b border-slate-700 pb-2 flex items-center gap-2">{modoEdicion ? <Pencil size={20} className="text-blue-500"/> : <Plus size={20} className="text-green-500"/>} {modoEdicion ? 'Editar' : 'Registrar'} {selectedType?.nombre}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedType?.campos?.map((c, i) => (
                  <div key={i}>
                    <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">{c.nombreEtiqueta}</label>
                    {c.nombreEtiqueta === 'Usuario Asignado' ? 
                        <UserSearchInput 
                            value={datosFormulario['Usuario Asignado']} 
                            onChange={id => handleInputChange(c, id)} 
                            usuarios={usuarios} 
                            selectedUserId={datosFormulario['Usuario Asignado']}
                        /> : 
                     c.tipoDato === 'dropdown' ? (
                      <select className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-sm outline-none focus:border-blue-500 transition-all" value={getFieldValue(c)} onChange={e => handleInputChange(c, e.target.value)}>
                        <option value="">-- Seleccionar --</option>
                        {c.opciones?.map(op => <option key={op} value={op}>{op}</option>)}
                      </select>
                     ) : <input 
                            className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-sm outline-none focus:border-blue-500 transition-all" 
                            type={c.tipoDato === 'number' || c.nombreEtiqueta === 'Stock' ? 'number' : c.tipoDato === 'date' ? 'date' : 'text'} 
                            value={getFieldValue(c)} 
                            onChange={e => handleInputChange(c, e.target.value)} 
                            required={['Marca','Modelo'].includes(c.nombreEtiqueta)}
                        />}
                  </div>
                ))}
                <button className="col-span-1 md:col-span-2 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95"><Save size={18}/> Guardar</button>
              </form>
            </div>
          )}

          {mostrarAsignacionStock && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMostrarAsignacionStock(false)}></div>
              <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden">
                <div className="p-6 border-b border-slate-700"><h3 className="text-xl font-bold flex items-center gap-2 text-white"><Share size={20} className="text-blue-500"/> Asignar desde Stock</h3></div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold mb-1 block uppercase">Seleccionar Modelo ({modelosConStock.length} disponibles)</label>
                        <select 
                            className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-sm outline-none focus:border-blue-500" 
                            value={stockItem?._id || ''} 
                            onChange={(e) => setStockItem(activos.find(a => a._id === e.target.value))}
                        >
                            <option value="">-- Elegir Modelo --</option>
                            {modelosConStock.map(m => (
                                <option key={m._id} value={m._id}>{m.marca} {m.modelo} (Stock: {m.detallesTecnicos?.['Stock']})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold mb-1 block uppercase">Usuario</label>
                        <UserSearchInput value={asignacionData.usuario} onChange={(id) => setAsignacionData({...asignacionData, usuario: id})} usuarios={usuarios} selectedUserId={asignacionData.usuario}/>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold mb-1 block uppercase">Motivo</label>
                        <input className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-sm outline-none focus:border-blue-500" placeholder="Ej: Nuevo ingreso" value={asignacionData.motivo} onChange={e => setAsignacionData({...asignacionData, motivo: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold mb-1 block uppercase">Fecha</label>
                        <input type="date" className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-white text-sm outline-none focus:border-blue-500" value={asignacionData.fecha} onChange={e => setAsignacionData({...asignacionData, fecha: e.target.value})}/>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-900/20">
                    <button onClick={() => setMostrarAsignacionStock(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
                    <button onClick={handleStockAssignment} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"><Check size={18}/> Confirmar</button>
                </div>
              </div>
            </div>
          )}

          {modoImportar && (
            <div className="bg-slate-800 p-6 rounded-xl border-2 border-blue-600 mb-8 animate-fade-in relative z-20 shadow-2xl">
              <div className="flex justify-between mb-4"><h2 className="font-bold flex items-center gap-2"><Download/> Importar {selectedType.nombre}</h2><button onClick={() => setModoImportar(false)} className="hover:text-red-500 transition-colors"><X/></button></div>
              <div className="overflow-x-auto relative">
                <table className="w-full text-left text-xs mb-4 min-w-[800px]">
                  <thead><tr className="bg-slate-900">{headersExcel.map((h, i) => (<th key={i} className="p-2 min-w-[150px] border border-slate-700">
                    <select className="w-full bg-blue-600 text-white p-1 rounded mb-1 outline-none hover:bg-blue-500 transition-colors" onChange={(e) => setMapeo({...mapeo, [i]: e.target.value})}><option value="">Ignorar</option>
                      {selectedType.campos.map(c => <option key={c.nombreEtiqueta} value={c.nombreEtiqueta}>{c.nombreEtiqueta}</option>)}
                    </select><div className="text-slate-500 px-1">{h}</div>
                  </th>))}</tr></thead>
                </table>
              </div>
              <button onClick={finalizarImportacion} disabled={procesando} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold transition-all shadow-md active:scale-95">Confirmar e Importar {archivoData.length} registros</button>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto shadow-xl relative min-h-[450px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 z-[30]">
                <tr>
                  <th className="p-4 w-12 border-b border-slate-700"><button onClick={() => setSeleccionados(seleccionados.length === activosFiltrados.length ? [] : activosFiltrados.map(a=>a._id))} className="hover:text-blue-500 transition-colors"><CheckSquare size={18} className={seleccionados.length > 0 && seleccionados.length === activosFiltrados.length ? "text-blue-500" : "text-slate-600"}/></button></th>
                  <th className="p-4 w-10 border-b border-slate-700"></th>
                  {selectedType?.campos?.map((c, i) => <th key={i} className="p-4 border-b border-slate-700 text-blue-300 min-w-[150px]"><div className="flex items-center">{c.nombreEtiqueta} <FilterDropdown colKey={c.nombreEtiqueta}/></div></th>)}
                  <th className="p-4 border-b border-slate-700 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {activosFiltrados.length === 0 ? (
                  <tr><td colSpan="100%" className="p-8 text-center text-slate-500 italic animate-fade-in">No se encontraron activos.</td></tr>
                ) : (
                  activosFiltrados.map((a, i) => (
                    <tr key={a._id} className={`group hover:bg-slate-700/30 transition-all ${seleccionados.includes(a._id) ? 'bg-blue-900/20' : ''}`}>
                      <td className="p-4 text-center"><button onClick={(e) => handleSelectOne(a._id, i, e)} className="hover:text-blue-400 transition-colors"><CheckSquare size={18} className={seleccionados.includes(a._id) ? "text-blue-500" : "text-slate-600"}/></button></td>
                      <td className="p-4 group-hover:scale-110 transition-transform">{getIcon(selectedType?.nombre)}</td>
                      {selectedType?.campos?.map((c, idx) => {
                        const display = getFieldValue(c, a);
                        
                        if (c.nombreEtiqueta === 'Stock') return <td key={idx} className="p-4"><span className="bg-green-900/30 text-green-400 px-2 py-1 rounded font-mono font-bold text-xs">{display} Unidades</span></td>;

                        if (c.nombreEtiqueta === 'Estado') return (
                          <td key={idx} className="p-4">
                            <select value={a.estado} onChange={e => axios.put(`https://itsoft-backend.onrender.com/api/assets/${a._id}`, { estado: e.target.value }).then(cargarDatos)} className={`bg-transparent border rounded px-1 text-[10px] font-bold outline-none cursor-pointer transition-all ${a.estado === 'Disponible' ? 'text-green-400 border-green-500/20 hover:bg-green-500/10' : 'text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/10'}`}>
                              <option value="Disponible">Disponible</option><option value="Asignado">Asignado</option><option value="Reparación">Reparación</option><option value="Baja">Baja</option>
                            </select>
                          </td>
                        );
                        return <td key={idx} className="p-4 text-xs group-hover:text-white transition-colors">{display}</td>;
                      })}
                      <td className="p-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {selectedType.campos.some(c => c.nombreEtiqueta === 'Stock') && (
                            <button onClick={() => prepararAsignacionStockIndividual(a)} className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 mr-2">
                                <Share size={14}/> Asignar
                            </button>
                        )}
                        <button onClick={() => prepararEdicion(a)} className="text-blue-400 p-1 hover:bg-slate-700 rounded-md transition-all hover:scale-110"><Pencil size={16}/></button>
                        <button onClick={() => { if(window.confirm('¿Borrar activo?')) axios.delete(`https://itsoft-backend.onrender.com/api/assets/${a._id}`).then(cargarDatos); }} className="text-red-400 p-1 hover:bg-slate-700 rounded-md transition-all hover:scale-110"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
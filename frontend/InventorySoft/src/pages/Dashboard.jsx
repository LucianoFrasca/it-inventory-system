import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Pin, Filter, Trash2, AlertTriangle, Package, ChevronRight, BarChart3, Settings, Eye, EyeOff, ArrowLeft, ArrowRight, Activity, DollarSign, Plus, X, List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORES_GRAFICO = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STOCK_MINIMO = 10;

const Dashboard = () => {
  const navigate = useNavigate();
  const [activos, setActivos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Estados Constructor Pro
  const [selectedTypeId, setSelectedTypeId] = useState(''); 
  const [filtrosBuilder, setFiltrosBuilder] = useState([]);
  
  // Widgets y Config
  const [widgetsFijados, setWidgetsFijados] = useState(() => {
    const guardados = localStorage.getItem('dashboardWidgets');
    return guardados ? JSON.parse(guardados) : [];
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [configTipos, setConfigTipos] = useState(() => {
      const guardados = localStorage.getItem('dashboardOrder');
      return guardados ? JSON.parse(guardados) : [];
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resA, resT, resL] = await Promise.all([
          axios.get('http://localhost:5000/api/assets'),
          axios.get('http://localhost:5000/api/asset-types'),
          axios.get('http://localhost:5000/api/logs') 
        ]);
        setActivos(resA.data);
        setTipos(resT.data);
        setLogs(resL.data.slice(0, 5));

        setConfigTipos(prev => {
            const nuevosIds = resT.data.map(t => t._id);
            const existentes = prev.map(p => p.id);
            const nuevos = resT.data.filter(t => !existentes.includes(t._id)).map(t => ({ id: t._id, visible: true }));
            return [...prev.filter(p => nuevosIds.includes(p.id)), ...nuevos];
        });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
      if (configTipos.length > 0) localStorage.setItem('dashboardOrder', JSON.stringify(configTipos));
  }, [configTipos]);

  // Logica Datos
  const irAlTipo = (tipoId) => {
      navigate('/activos', { state: { preSelectedTypeId: tipoId } });
  };

  const estadisticasPorTipo = useMemo(() => {
    return configTipos.map(conf => {
        const t = tipos.find(tipo => tipo._id === conf.id);
        if (!t) return null;
        const activosDelTipo = activos.filter(a => String(a.tipo?._id || a.tipo) === t._id);
        const tieneStock = t.campos.some(c => c.nombreEtiqueta === 'Stock');
        let asignados = 0;
        let disponibles = 0;
        if (tieneStock) {
            asignados = activosDelTipo.filter(a => a.usuarioAsignado).length;
            const itemsMaestros = activosDelTipo.filter(a => !a.usuarioAsignado);
            disponibles = itemsMaestros.reduce((sum, item) => sum + (parseInt(item.detallesTecnicos?.['Stock']) || 0), 0);
        } else {
            asignados = activosDelTipo.filter(a => a.estado === 'Asignado').length;
            disponibles = activosDelTipo.filter(a => a.estado === 'Disponible').length;
        }
        const total = asignados + disponibles;
        const porcentaje = total > 0 ? (asignados / total) * 100 : 0;
        return { id: t._id, nombre: t.nombre, asignados, disponibles, total, porcentaje, visible: conf.visible };
    }).filter(Boolean);
  }, [activos, tipos, configTipos]);

  const alertasStock = useMemo(() => {
      if (tipos.length === 0) return [];
      const alertas = tipos.map(t => {
          const tieneStockField = t.campos.some(c => c.nombreEtiqueta === 'Stock');
          const activosDelTipo = activos.filter(a => String(a.tipo?._id || a.tipo) === t._id);
          let stockDisponible = 0;
          if (tieneStockField) {
              stockDisponible = activosDelTipo.filter(a => !a.usuarioAsignado).reduce((sum, a) => sum + (parseInt(a.detallesTecnicos?.['Stock']) || 0), 0);
          } else {
              stockDisponible = activosDelTipo.filter(a => a.estado === 'Disponible').length;
          }
          return { id: t._id, nombre: t.nombre, stock: stockDisponible };
      });
      return alertas.filter(a => a.stock < STOCK_MINIMO).sort((a,b) => a.stock - b.stock);
  }, [activos, tipos]);

  // --- LÓGICA DEL CONSTRUCTOR PRO ---
  
  const camposDisponibles = useMemo(() => {
      if (!selectedTypeId) return [];
      const tipo = tipos.find(t => t._id === selectedTypeId);
      if (!tipo) return [];

      const baseFields = [
          { label: 'Estado', value: 'estado', type: 'select' },
          { label: 'Marca', value: 'marca', type: 'text' },
          { label: 'Modelo', value: 'modelo', type: 'text' },
          { label: 'Serial Number', value: 'serialNumber', type: 'text' },
          { label: 'Usuario Asignado', value: 'usuario', type: 'text' }
      ];

      const dynamicFields = tipo.campos.map(c => ({
          label: c.nombreEtiqueta,
          value: `dt_${c.nombreEtiqueta}`, 
          type: c.tipoDato === 'date' ? 'date' : 'text'
      }));

      return [...baseFields, ...dynamicFields];
  }, [selectedTypeId, tipos]);

  const obtenerValor = (activo, campoKey) => {
      if (campoKey === 'usuario') return activo.usuarioAsignado ? `${activo.usuarioAsignado.nombre} ${activo.usuarioAsignado.apellido}` : '';
      if (campoKey.startsWith('dt_')) {
          const keyReal = campoKey.replace('dt_', '');
          return activo.detallesTecnicos?.[keyReal] || '';
      }
      return activo[campoKey] || '';
  };

  const obtenerOpcionesUnicas = (campoKey) => {
      if (!selectedTypeId) return [];
      const activosDelTipo = activos.filter(a => String(a.tipo?._id || a.tipo) === selectedTypeId);
      const valores = activosDelTipo.map(a => obtenerValor(a, campoKey)).filter(Boolean); 
      return [...new Set(valores)].sort(); 
  };

  const filtrarAvanzado = (activosBase, reglas) => {
      return activosBase.filter(activo => {
          if (selectedTypeId && String(activo.tipo?._id || activo.tipo) !== selectedTypeId) return false;
          if (reglas.length === 0) return true;

          return reglas.every(regla => {
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
      });
  };

  const datosFiltrados = useMemo(() => {
      return filtrarAvanzado(activos, filtrosBuilder);
  }, [activos, selectedTypeId, filtrosBuilder]);

  const agregarFiltro = () => {
      if (camposDisponibles.length === 0) return;
      setFiltrosBuilder([...filtrosBuilder, { id: Date.now(), campo: camposDisponibles[0].value, operador: 'contiene', valor: '' }]);
  };

  const actualizarFiltro = (id, key, val) => {
      setFiltrosBuilder(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const quitarFiltro = (id) => {
      setFiltrosBuilder(prev => prev.filter(f => f.id !== id));
  };

  const fijarWidget = () => {
      if (!selectedTypeId) return alert("Selecciona un tipo");
      const tipoNombre = tipos.find(t => t._id === selectedTypeId)?.nombre || 'Reporte';
      const titulo = prompt("Nombre para este reporte:", `Reporte de ${tipoNombre}`);
      if (titulo) {
          const nuevoWidget = { id: Date.now(), titulo, configBuilder: { typeId: selectedTypeId, reglas: filtrosBuilder } };
          const nuevos = [...widgetsFijados, nuevoWidget];
          setWidgetsFijados(nuevos); localStorage.setItem('dashboardWidgets', JSON.stringify(nuevos));
          setSelectedTypeId(''); setFiltrosBuilder([]);
      }
  };

  // --- NUEVA FUNCIÓN: VER RESULTADOS ---
  const verListadoCompleto = () => {
      if (!selectedTypeId) return;
      // Navegamos pasando el tipo y las reglas personalizadas
      navigate('/activos', { 
          state: { 
              preSelectedTypeId: selectedTypeId,
              customRules: filtrosBuilder
          } 
      });
  };

  const eliminarWidget = (id) => {
      const actualizados = widgetsFijados.filter(w => w.id !== id);
      setWidgetsFijados(actualizados); localStorage.setItem('dashboardWidgets', JSON.stringify(actualizados));
  };

  const WidgetCard = ({ widget }) => {
      let data = [];
      if (widget.configBuilder) {
          data = filtrarAvanzado(activos, widget.configBuilder.reglas);
          data = data.filter(a => String(a.tipo?._id || a.tipo) === widget.configBuilder.typeId);
      } else if (widget.criterios) {
          data = activos.filter(a => {
              if (widget.criterios.tipo && String(a.tipo?._id || a.tipo) !== widget.criterios.tipo) return false;
              if (widget.criterios.estado && a.estado !== widget.criterios.estado) return false;
              if (widget.criterios.texto && !JSON.stringify(a).toLowerCase().includes(widget.criterios.texto.toLowerCase())) return false;
              return true;
          });
      }
      const porMarca = data.reduce((acc, curr) => { const m = curr.marca || 'Genérico'; acc[m] = (acc[m] || 0) + 1; return acc; }, {});
      const dataGrafico = Object.keys(porMarca).map(k => ({ name: k, value: porMarca[k] }));

      return (
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg relative group hover:border-blue-500 transition-all cursor-pointer" 
             // Al hacer click en un widget fijado, también mandamos sus reglas
             onClick={() => navigate('/activos', { 
                 state: widget.configBuilder ? { preSelectedTypeId: widget.configBuilder.typeId, customRules: widget.configBuilder.reglas } : { preSelectedTypeId: widget.criterios?.tipo } 
             })}>
            
            <button onClick={(e) => { e.stopPropagation(); eliminarWidget(widget.id); }} className="absolute top-3 right-3 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Pin size={14} className="text-blue-500"/> {widget.titulo}</h3>
            <div className="flex justify-between items-end">
                <div><span className="text-4xl font-bold text-white">{data.length}</span><span className="text-xs text-slate-500 ml-2">items</span></div>
                <div className="w-16 h-16"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dataGrafico} innerRadius={15} outerRadius={30} paddingAngle={2} dataKey="value">{dataGrafico.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORES_GRAFICO[index % COLORES_GRAFICO.length]} />))}</Pie></PieChart></ResponsiveContainer></div>
            </div>
        </div>
      );
  };

  // UI Helpers
  const moverItem = (index, direccion) => {
      const nuevoOrden = [...configTipos];
      const item = nuevoOrden[index];
      const nuevaPos = index + direccion;
      if (nuevaPos >= 0 && nuevaPos < nuevoOrden.length) {
          nuevoOrden.splice(index, 1); nuevoOrden.splice(nuevaPos, 0, item); setConfigTipos(nuevoOrden);
      }
  };
  const toggleVisibilidad = (id) => setConfigTipos(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p));

  return (
    <div className="p-8 pb-24 text-slate-200 animate-fade-in">
      <style>{` .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; } `}</style>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex gap-3 items-center"><LayoutDashboard className="text-blue-500"/> Dashboard</h1>
        <span className="text-sm text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{new Date().toLocaleDateString()}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 min-h-[400px]">
          {/* ... (Las columnas 1, 2 y 3 quedan IGUAL que antes, no las toques) ... */}
          {/* ... Si copias todo el archivo, asegúrate de mantener la estructura de columnas que arreglamos en el paso anterior ... */}
          
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 text-orange-500 pb-2 border-b border-slate-700"><AlertTriangle size={24}/> <h2 className="text-lg font-bold">Stock Crítico ({alertasStock.length})</h2></div>
              <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
                  {alertasStock.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500 italic">Stock saludable</div> : 
                      alertasStock.map(item => (
                          <div key={item.id} onClick={() => irAlTipo(item.id)} className="group cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors border border-transparent hover:border-slate-600">
                              <div className="flex justify-between text-sm mb-1"><span className="text-slate-300 font-medium group-hover:text-blue-400 transition-colors">{item.nombre}</span><span className="font-bold text-red-400 text-xs bg-red-900/20 px-2 py-0.5 rounded border border-red-900/50">{item.stock} u.</span></div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden"><div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${(item.stock / STOCK_MINIMO) * 100}%` }}></div></div>
                          </div>
                      ))
                  }
              </div>
          </div>
          <div className="flex flex-col gap-6 h-full">
             <div onClick={() => navigate('/activos')} className="bg-slate-800 p-6 rounded-2xl border-l-4 border-blue-500 shadow-lg cursor-pointer hover:bg-slate-750 transition-all group flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start"><div><p className="text-xs text-slate-400 uppercase font-bold mb-1">Total Activos</p><h3 className="text-5xl font-bold text-white group-hover:text-blue-400 transition-colors">{activos.length}</h3></div><div className="p-4 bg-blue-900/20 rounded-full text-blue-400"><Package size={32}/></div></div>
                <div className="flex items-center text-xs text-blue-400 font-bold mt-2">Ver inventario <ChevronRight size={14}/></div>
             </div>
             <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-purple-500 shadow-lg flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start"><div><p className="text-xs text-slate-400 uppercase font-bold mb-1">Valorización Total</p><h3 className="text-4xl font-bold text-white">$ 0.00</h3><p className="text-[10px] text-slate-500 mt-1">Calculado en base a costos</p></div><div className="p-4 bg-purple-900/20 rounded-full text-purple-400"><DollarSign size={32}/></div></div>
             </div>
          </div>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Activity size={20} className="text-green-400"/> Actividad</h3><button onClick={() => navigate('/logs')} className="text-xs hover:text-white text-slate-400 transition-colors">Ver Todo</button></div>
              <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  {logs.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-slate-500 italic"><Activity size={32} className="mb-2 opacity-20"/><p>Sin actividad reciente</p></div>) : (
                      logs.map(log => (
                          <div key={log._id} className="flex gap-3 items-start p-2 hover:bg-slate-700/30 rounded transition-colors cursor-default">
                              <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${log.accion === 'Asignación' ? 'bg-green-500' : log.accion === 'Baja' ? 'bg-red-500' : log.accion === 'Devolución' ? 'bg-blue-500' : log.accion === 'Creación' ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                              <div><p className="text-sm text-white font-medium leading-tight">{log.activo}</p><p className="text-xs text-slate-400">{log.accion} • {log.usuario}</p><span className="text-[10px] text-slate-600 block mt-1">{new Date(log.fecha).toLocaleDateString()} {new Date(log.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 size={20} className="text-green-500"/> Estado del Inventario</h2>
            <button onClick={() => setModoEdicion(!modoEdicion)} className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${modoEdicion ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}><Settings size={14}/> {modoEdicion ? 'Guardar Orden' : 'Personalizar'}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estadisticasPorTipo.map((stat, index) => {
                if (!modoEdicion && !stat.visible) return null;
                return (
                    <div key={stat.id} className={`bg-slate-800 p-5 rounded-xl border shadow-md transition-all relative ${modoEdicion ? 'border-dashed border-blue-500 bg-slate-800/80' : 'border-slate-700 hover:border-slate-500 cursor-pointer'}`} onClick={() => !modoEdicion && irAlTipo(stat.id)}>
                        {modoEdicion && (<div className="absolute -top-3 -right-2 flex gap-1 bg-slate-900 border border-slate-600 rounded-full p-1 shadow-xl z-10">
                                <button onClick={(e) => { e.stopPropagation(); moverItem(index, -1); }} className="p-1 hover:text-blue-400 disabled:opacity-30" disabled={index === 0}><ArrowLeft size={14}/></button>
                                <button onClick={(e) => { e.stopPropagation(); toggleVisibilidad(stat.id); }} className={`p-1 ${stat.visible ? 'text-green-400' : 'text-slate-600'}`}>{stat.visible ? <Eye size={14}/> : <EyeOff size={14}/>}</button>
                                <button onClick={(e) => { e.stopPropagation(); moverItem(index, 1); }} className="p-1 hover:text-blue-400 disabled:opacity-30" disabled={index === estadisticasPorTipo.length - 1}><ArrowRight size={14}/></button>
                            </div>)}
                        <div className={`transition-opacity ${modoEdicion && !stat.visible ? 'opacity-40 grayscale' : ''}`}>
                            <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-white">{stat.nombre}</h3><span className="text-xs bg-slate-900 text-slate-400 px-2 py-1 rounded-full">{stat.total} Total</span></div>
                            <div className="w-full bg-slate-900 rounded-full h-4 mb-3 overflow-hidden border border-slate-700"><div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${stat.porcentaje}%` }}></div></div>
                            <div className="flex justify-between text-xs font-mono"><span className="text-blue-400 font-bold">{stat.asignados} Asignados</span><span className="text-green-400 font-bold">{stat.disponibles} Disponibles</span></div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {widgetsFijados.length > 0 && (
          <div className="mb-10 animate-fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Pin size={20} className="text-slate-400"/> Reportes Fijados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {widgetsFijados.map(w => <WidgetCard key={w.id} widget={w}/>)}
            </div>
          </div>
      )}

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -z-0"></div>
        <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4 relative z-10">
            <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><Filter size={20} className="text-blue-500"/> Constructor de Reportes Pro</h2><p className="text-sm text-slate-500 mt-1">Genera consultas avanzadas y fíjalas en tu tablero.</p></div>
            
            {/* --- AQUÍ ESTÁN LOS BOTONES --- */}
            {datosFiltrados.length > 0 && selectedTypeId && (
                <div className="flex gap-3">
                    {/* Botón Ver Resultados */}
                    <button onClick={verListadoCompleto} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all">
                        <List size={18}/> Ver Resultados
                    </button>
                    {/* Botón Fijar Reporte */}
                    <button onClick={fijarWidget} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                        <Pin size={18}/> Fijar Reporte
                    </button>
                </div>
            )}
        </div>

        <div className="relative z-10">
            {/* ... (Resto del constructor sigue igual, con el datalist que agregamos antes) ... */}
            <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">1. Selecciona Tipo de Activo</label>
                <select className="w-full md:w-1/3 bg-slate-800 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-blue-500 transition-all" value={selectedTypeId} onChange={(e) => { setSelectedTypeId(e.target.value); setFiltrosBuilder([]); }}>
                    <option value="">-- Seleccionar --</option>{tipos.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
                </select>
            </div>

            {selectedTypeId && (
                <div className="mb-8 animate-fade-in">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">2. Definir Reglas de Filtrado</label>
                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
                        {filtrosBuilder.length === 0 && (<p className="text-slate-500 text-sm italic p-2">No hay reglas activas. Se muestran todos los activos de este tipo.</p>)}
                        
                        {filtrosBuilder.map((filtro, index) => (
                            <div key={filtro.id} className="flex flex-col md:flex-row gap-3 items-center animate-fade-in">
                                <span className="text-slate-500 font-mono text-xs w-6 text-center">{index === 0 ? 'WHERE' : 'AND'}</span>
                                <select className="flex-1 bg-slate-900 border border-slate-600 p-2 rounded text-sm text-white outline-none focus:border-blue-500" value={filtro.campo} onChange={(e) => actualizarFiltro(filtro.id, 'campo', e.target.value)}>
                                    {camposDisponibles.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                                <select className="w-40 bg-slate-900 border border-slate-600 p-2 rounded text-sm text-white outline-none focus:border-blue-500" value={filtro.operador} onChange={(e) => actualizarFiltro(filtro.id, 'operador', e.target.value)}>
                                    <option value="contiene">Contiene</option><option value="igual">Es igual a</option><option value="no_contiene">No contiene</option><option value="mayor">Mayor que</option><option value="menor">Menor que</option><option value="fecha_mayor">Después de</option><option value="fecha_menor">Antes de</option>
                                </select>

                                <input 
                                    type={filtro.operador.includes('fecha') ? 'date' : 'text'}
                                    className="flex-1 bg-slate-900 border border-slate-600 p-2 rounded text-sm text-white outline-none focus:border-blue-500"
                                    placeholder="Valor..."
                                    value={filtro.valor}
                                    onChange={(e) => actualizarFiltro(filtro.id, 'valor', e.target.value)}
                                    list={`list-${filtro.id}`} 
                                />
                                <datalist id={`list-${filtro.id}`}>
                                    {obtenerOpcionesUnicas(filtro.campo).map(opcion => (
                                        <option key={opcion} value={opcion}/>
                                    ))}
                                </datalist>

                                <button onClick={() => quitarFiltro(filtro.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><X size={18}/></button>
                            </div>
                        ))}
                        <button onClick={agregarFiltro} className="mt-2 text-blue-400 text-sm font-bold flex items-center gap-1 hover:text-blue-300 transition-colors"><Plus size={16}/> Agregar Regla</button>
                    </div>
                </div>
            )}

            {selectedTypeId && (
                 <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col items-center justify-center min-h-[150px] animate-fade-in">
                    {datosFiltrados.length > 0 ? (
                        <>
                            <h3 className="text-4xl font-bold text-white mb-2">{datosFiltrados.length}</h3>
                            <p className="text-slate-400 uppercase text-xs font-bold tracking-wider mb-4">Resultados Encontrados</p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                                {datosFiltrados.slice(0, 5).map(a => (
                                    <div key={a._id} className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-600">{a.marca} {a.modelo}</div>
                                ))}
                                {datosFiltrados.length > 5 && <span className="text-xs text-slate-500 py-1">...+{datosFiltrados.length - 5} más</span>}
                            </div>
                        </>
                    ) : (<p className="text-slate-500 italic">No hay datos que coincidan con estos filtros.</p>)}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
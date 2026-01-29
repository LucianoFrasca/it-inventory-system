import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, Pin, Filter, Trash2, AlertTriangle, Package, ChevronRight, BarChart3, Settings, Eye, EyeOff, ArrowLeft, ArrowRight, Activity, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLORES_GRAFICO = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const STOCK_MINIMO = 10;

// DATOS DE EJEMPLO PARA LOGS
const LOGS_EJEMPLO = [
    { id: 1, accion: 'Asignación', activo: 'Dell Latitude 5420', usuario: 'Juan Perez', fecha: 'Hoy, 10:30' },
    { id: 2, accion: 'Devolución', activo: 'Auriculares Logitech', usuario: 'Ana Gomez', fecha: 'Ayer, 15:45' },
    { id: 3, accion: 'Baja', activo: 'Monitor Samsung 24"', usuario: 'Carlos Ruiz', fecha: '28/01' },
    { id: 4, accion: 'Asignación', activo: 'Mouse Genius', usuario: 'Sofia Lopez', fecha: '28/01' },
    { id: 5, accion: 'Creación', activo: 'MacBook Pro', usuario: 'Admin', fecha: '27/01' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [activos, setActivos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados del Constructor
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTexto, setFiltroTexto] = useState('');
  
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
        const [resA, resT] = await Promise.all([
          axios.get('http://localhost:5000/api/assets'),
          axios.get('http://localhost:5000/api/asset-types')
        ]);
        setActivos(resA.data);
        setTipos(resT.data);

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
  
  const filtrarDatos = (criterios) => {
    return activos.filter(a => {
      if (criterios.tipo && String(a.tipo?._id || a.tipo) !== criterios.tipo) return false;
      if (criterios.estado && a.estado !== criterios.estado) return false;
      if (criterios.texto) {
        const contenido = JSON.stringify(a).toLowerCase();
        if (!contenido.includes(criterios.texto.toLowerCase())) return false;
      }
      return true;
    });
  };
  const datosPrevisualizacion = useMemo(() => filtrarDatos({ tipo: filtroTipo, estado: filtroEstado, texto: filtroTexto }), [activos, filtroTipo, filtroEstado, filtroTexto]);
  const fijarWidget = () => {
    const nombreDefault = `${filtroEstado || 'Todos'} - ${tipos.find(t=>t._id===filtroTipo)?.nombre || 'General'}`;
    const titulo = prompt("Nombre para este reporte:", nombreDefault);
    if (titulo) {
      const nuevoWidget = { id: Date.now(), titulo, criterios: { tipo: filtroTipo, estado: filtroEstado, texto: filtroTexto } };
      const nuevos = [...widgetsFijados, nuevoWidget];
      setWidgetsFijados(nuevos); localStorage.setItem('dashboardWidgets', JSON.stringify(nuevos));
      setFiltroTipo(''); setFiltroEstado(''); setFiltroTexto('');
    }
  };
  const eliminarWidget = (id) => {
    const actualizados = widgetsFijados.filter(w => w.id !== id);
    setWidgetsFijados(actualizados); localStorage.setItem('dashboardWidgets', JSON.stringify(actualizados));
  };
  const WidgetCard = ({ widget }) => {
    const data = filtrarDatos(widget.criterios);
    const porMarca = data.reduce((acc, curr) => { const m = curr.marca || 'Genérico'; acc[m] = (acc[m] || 0) + 1; return acc; }, {});
    const dataGrafico = Object.keys(porMarca).map(k => ({ name: k, value: porMarca[k] }));
    return (
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg relative group hover:border-blue-500 transition-all cursor-pointer" onClick={() => navigate('/activos')}>
        <button onClick={(e) => { e.stopPropagation(); eliminarWidget(widget.id); }} className="absolute top-3 right-3 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
        <h3 className="text-sm font-bold text-slate-400 uppercase mb-2 flex items-center gap-2"><Pin size={14} className="text-blue-500"/> {widget.titulo}</h3>
        <div className="flex justify-between items-end">
            <div><span className="text-4xl font-bold text-white">{data.length}</span><span className="text-xs text-slate-500 ml-2">items</span></div>
            <div className="w-16 h-16"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dataGrafico} innerRadius={15} outerRadius={30} paddingAngle={2} dataKey="value">{dataGrafico.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORES_GRAFICO[index % COLORES_GRAFICO.length]} />))}</Pie></PieChart></ResponsiveContainer></div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 pb-24 text-slate-200 animate-fade-in">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
      `}</style>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex gap-3 items-center"><LayoutDashboard className="text-blue-500"/> Dashboard</h1>
        <span className="text-sm text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{new Date().toLocaleDateString()}</span>
      </div>

      {/* --- GRID DE 3 COLUMNAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 min-h-[400px]">
          
          {/* COLUMNA 1: Stock Crítico */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 text-orange-500 pb-2 border-b border-slate-700">
                  <AlertTriangle size={24}/>
                  <h2 className="text-lg font-bold">Stock Crítico ({alertasStock.length})</h2>
              </div>
              <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
                  {alertasStock.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500 italic">Stock saludable</div> : 
                      alertasStock.map(item => (
                          <div key={item.id} onClick={() => irAlTipo(item.id)} className="group cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors border border-transparent hover:border-slate-600">
                              <div className="flex justify-between text-sm mb-1">
                                  <span className="text-slate-300 font-medium group-hover:text-blue-400 transition-colors">{item.nombre}</span>
                                  <span className="font-bold text-red-400 text-xs bg-red-900/20 px-2 py-0.5 rounded border border-red-900/50">{item.stock} u.</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${(item.stock / STOCK_MINIMO) * 100}%` }}></div>
                              </div>
                          </div>
                      ))
                  }
              </div>
          </div>

          {/* COLUMNA 2: Dos Rectángulos Apilados */}
          <div className="flex flex-col gap-6 h-full">
             
             {/* Total Activos */}
             <div onClick={() => navigate('/activos')} className="bg-slate-800 p-6 rounded-2xl border-l-4 border-blue-500 shadow-lg cursor-pointer hover:bg-slate-750 transition-all group flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total Activos</p>
                        <h3 className="text-5xl font-bold text-white group-hover:text-blue-400 transition-colors">{activos.length}</h3>
                    </div>
                    <div className="p-4 bg-blue-900/20 rounded-full text-blue-400"><Package size={32}/></div>
                </div>
                <div className="flex items-center text-xs text-blue-400 font-bold mt-2">Ver inventario <ChevronRight size={14}/></div>
             </div>
             
             {/* Valorización (Reemplazado por Logs Dummy) */}
             <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-purple-500 shadow-lg flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Valorización Total</p>
                        <h3 className="text-4xl font-bold text-white">$ 0.00</h3>
                        <p className="text-[10px] text-slate-500 mt-1">Calculado en base a costos</p>
                    </div>
                    <div className="p-4 bg-purple-900/20 rounded-full text-purple-400"><DollarSign size={32}/></div>
                </div>
             </div>
          </div>

          {/* COLUMNA 3: Logs Recientes */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><Activity size={20} className="text-green-400"/> Actividad</h3>
                  <button onClick={() => navigate('/logs')} className="text-xs hover:text-white text-slate-400 transition-colors">Ver Todo</button>
              </div>
              
              <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
                  {LOGS_EJEMPLO.map(log => (
                      <div key={log.id} className="flex gap-3 items-start p-2 hover:bg-slate-700/30 rounded transition-colors cursor-default">
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${log.accion === 'Asignación' ? 'bg-green-500' : log.accion === 'Baja' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                          <div>
                              <p className="text-sm text-white font-medium leading-tight">{log.activo}</p>
                              <p className="text-xs text-slate-400">{log.accion} • {log.usuario}</p>
                              <span className="text-[10px] text-slate-600 block mt-1">{log.fecha}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* --- SECCIÓN DE BARRAS DE PROGRESO --- */}
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

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
            <div><h2 className="text-xl font-bold text-white flex items-center gap-2"><Filter size={20} className="text-blue-500"/> Constructor de Reportes</h2><p className="text-sm text-slate-500 mt-1">Crea filtros personalizados.</p></div>
            {datosPrevisualizacion.length > 0 && (<button onClick={fijarWidget} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"><Pin size={18}/> Fijar Reporte</button>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tipo</label><select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-blue-500" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}><option value="">(Todos)</option>{tipos.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}</select></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Estado</label><select className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-blue-500" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}><option value="">(Todos)</option><option value="Disponible">Disponible</option><option value="Asignado">Asignado</option><option value="Reparación">Reparación</option><option value="Baja">Baja</option></select></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Búsqueda</label><input className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-white outline-none focus:border-blue-500" placeholder="Ej: Contagram..." value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)}/></div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col items-center justify-center min-h-[150px]">
            {datosPrevisualizacion.length > 0 ? (<><h3 className="text-4xl font-bold text-white mb-2">{datosPrevisualizacion.length}</h3><p className="text-slate-400 uppercase text-xs font-bold tracking-wider">Resultados</p></>) : <p className="text-slate-500 italic">Sin resultados.</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
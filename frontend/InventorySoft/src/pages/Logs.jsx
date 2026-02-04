import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Activity, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Logs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- CARGA DE DATOS REALES ---
  useEffect(() => {
    const fetchLogs = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/logs');
            setLogs(res.data);
        } catch (error) {
            console.error("Error cargando logs:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-8 text-slate-200 animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
         <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-all shadow-md">
            <ArrowLeft size={20}/>
         </button>
         <h1 className="text-3xl font-bold flex gap-3 text-purple-400 items-center">
            <Activity size={32}/> Logs de Auditoría
         </h1>
      </div>

      <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={18}/>
              <input 
                className="w-full bg-slate-800 border border-slate-700 p-2.5 pl-10 rounded-lg outline-none focus:border-blue-500" 
                placeholder="Buscar por usuario, activo o acción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <button className="bg-slate-800 border border-slate-700 px-4 rounded-lg flex items-center gap-2 hover:bg-slate-700 transition-colors">
              <Filter size={18}/> Filtros
          </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-700">Acción</th>
              <th className="p-4 border-b border-slate-700">Activo / Serial</th>
              <th className="p-4 border-b border-slate-700">Usuario Involucrado</th>
              <th className="p-4 border-b border-slate-700">Detalle</th>
              <th className="p-4 border-b border-slate-700">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">Cargando historial...</td></tr>
            ) : logs.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 italic">No hay registros de actividad aún.</td></tr>
            ) : (
                logs.filter(l => JSON.stringify(l).toLowerCase().includes(searchTerm.toLowerCase())).map(log => (
                    <tr key={log._id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                                log.accion === 'Asignación' ? 'bg-green-900/30 text-green-400' : 
                                log.accion === 'Baja' ? 'bg-red-900/30 text-red-400' : 
                                log.accion === 'Devolución' ? 'bg-blue-900/30 text-blue-400' : 
                                log.accion === 'Creación' ? 'bg-purple-900/30 text-purple-400' : 'bg-slate-700 text-slate-300'
                            }`}>
                                {log.accion}
                            </span>
                        </td>
                        <td className="p-4">
                            <div className="font-bold text-white">{log.activo}</div>
                            <div className="text-xs text-slate-500 font-mono">{log.serial || '-'}</div>
                        </td>
                        <td className="p-4 text-slate-300">
                            {log.usuario}
                        </td>
                        <td className="p-4 text-sm text-slate-400 italic">
                            {log.detalles || '-'}
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                             {new Date(log.fecha).toLocaleString()}
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
import { useState } from 'react';
import { ArrowLeft, Activity, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// DUMMY DATA PARA VISUALIZACIÓN
const MOCK_LOGS = [
    { id: 1, accion: 'Asignación', activo: 'Dell Latitude 5420', serial: 'HK992L', usuario: 'Juan Perez', fecha: '29/01/2024 10:30', detalle: 'Nuevo ingreso' },
    { id: 2, accion: 'Devolución', activo: 'Auriculares Logitech', serial: 'STK-001', usuario: 'Ana Gomez', fecha: '28/01/2024 15:45', detalle: 'Renuncia' },
    { id: 3, accion: 'Baja', activo: 'Monitor Samsung 24"', serial: 'MN-221', usuario: 'Carlos Ruiz', fecha: '28/01/2024 09:00', detalle: 'Pantalla rota' },
    { id: 4, accion: 'Creación', activo: 'MacBook Pro M1', serial: 'APPLE-X1', usuario: 'Sistema', fecha: '27/01/2024 18:20', detalle: 'Compra nueva' },
    { id: 5, accion: 'Asignación', activo: 'Mouse Genius', serial: 'STK-005', usuario: 'Sofia Lopez', fecha: '27/01/2024 11:15', detalle: 'Reemplazo' },
];

const Logs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState(MOCK_LOGS);

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
            {logs.filter(l => JSON.stringify(l).toLowerCase().includes(searchTerm.toLowerCase())).map(log => (
                <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                            log.accion === 'Asignación' ? 'bg-green-900/30 text-green-400' : 
                            log.accion === 'Baja' ? 'bg-red-900/30 text-red-400' : 
                            log.accion === 'Devolución' ? 'bg-blue-900/30 text-blue-400' : 'bg-slate-700 text-slate-300'
                        }`}>
                            {log.accion}
                        </span>
                    </td>
                    <td className="p-4">
                        <div className="font-bold text-white">{log.activo}</div>
                        <div className="text-xs text-slate-500 font-mono">{log.serial}</div>
                    </td>
                    <td className="p-4 text-slate-300">
                        {log.usuario}
                    </td>
                    <td className="p-4 text-sm text-slate-400 italic">
                        {log.detalle}
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                        {log.fecha}
                    </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
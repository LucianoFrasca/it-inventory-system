import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Search, ArrowLeft, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WriteOffs = () => {
  const navigate = useNavigate();
  const [bajas, setBajas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { cargarBajas(); }, []);

  const cargarBajas = async () => {
    try {
      const res = await axios.get('https://itsoft-backend.onrender.com/api/assets');
      // Filtramos solo los que tengan estado "Baja"
      const filtrados = res.data.filter(a => a.estado === 'Baja');
      setBajas(filtrados);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="p-8 text-slate-200 animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
         <button onClick={() => navigate('/')} className="p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-all"><ArrowLeft size={20}/></button>
         <h1 className="text-3xl font-bold flex gap-3 text-red-500"><Trash2/> Activos Dados de Baja</h1>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="p-4">Dispositivo</th>
              <th className="p-4">Detalles</th>
              <th className="p-4">Último Dueño</th>
              <th className="p-4">Motivo de Baja</th>
              <th className="p-4">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {bajas.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No hay activos dados de baja.</td></tr>
            ) : (
                bajas.map(b => (
                    <tr key={b._id} className="hover:bg-slate-700/30">
                        <td className="p-4 font-bold text-white">{b.tipo?.nombre || 'Activo'}</td>
                        <td className="p-4">
                            <div className="text-sm text-white">{b.marca} {b.modelo}</div>
                            {/* Mostramos serial solo si no es el generico STK */}
                            {!b.serialNumber?.startsWith('STK-') && <div className="text-xs text-slate-500 font-mono">{b.serialNumber}</div>}
                        </td>
                        <td className="p-4">
                            {b.usuarioAsignado ? (
                                <div className="flex items-center gap-2 text-blue-300">
                                    <User size={14}/> {b.usuarioAsignado.nombre} {b.usuarioAsignado.apellido}
                                </div>
                            ) : <span className="text-slate-500">-</span>}
                        </td>
                        <td className="p-4 text-sm text-red-300 bg-red-900/10 rounded">
                            {b.detallesTecnicos?.['Motivo Baja'] || 'No especificado'}
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                            {b.detallesTecnicos?.['Fecha Baja'] || '-'}
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

export default WriteOffs;
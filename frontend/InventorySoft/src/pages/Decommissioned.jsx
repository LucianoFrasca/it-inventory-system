import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  AlertCircle, Search, Filter, Download, Calendar, AlertTriangle, 
  User, Trash2, Pencil
} from 'lucide-react';
import AssetModal from '../components/AssetModal'; // <--- Reutilizamos el modal estético

const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : 'https://itsoft-backend.onrender.com/api';

const Decommissioned = () => {
  const [bajas, setBajas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');

  // Estados para Edición
  const [mostrarModal, setMostrarModal] = useState(false);
  const [activoParaEditar, setActivoParaEditar] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    try {
        const [resAssets, resTypes] = await Promise.all([
            axios.get(`${API_URL}/assets`, config),
            axios.get(`${API_URL}/asset-types`, config)
        ]);
        // Filtramos solo los que están en estado 'Baja'
        const bajasList = resAssets.data.filter(a => a.estado === 'Baja');
        setBajas(bajasList);
        setTipos(resTypes.data);
    } catch (e) {
        console.error("Error cargando bajas", e);
    } finally {
        setLoading(false);
    }
  };

  // --- LÓGICA DE ELIMINAR ---
  const handleDelete = async (id) => {
      if(!window.confirm("¿Estás seguro de eliminar este registro PERMANENTEMENTE? Desaparecerá del historial.")) return;
      
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`${API_URL}/assets/${id}`, { headers: { 'x-auth-token': token } });
          cargarDatos(); // Recargar la lista
      } catch (e) {
          alert("Error al eliminar: " + e.message);
      }
  };

  // --- LÓGICA DE EDITAR ---
  const handleEdit = (activo) => {
      setActivoParaEditar(activo);
      setMostrarModal(true);
  };

  const guardarCambios = async (id, data) => {
      const token = localStorage.getItem('token');
      try {
          // Preparamos el body manteniendo la estructura
          const body = { 
              ...data, 
              detallesTecnicos: { ...data } 
          };
          // Limpieza de campos raíz redundantes
          delete body.detallesTecnicos.marca;
          delete body.detallesTecnicos.modelo;
          delete body.detallesTecnicos.serialNumber;
          delete body.detallesTecnicos.estado;

          await axios.put(`${API_URL}/assets/${id}`, body, { headers: { 'x-auth-token': token } });
          setMostrarModal(false);
          cargarDatos(); // Recargar para ver cambios
      } catch (e) {
          alert("Error al actualizar: " + e.message);
      }
  };

  const filteredBajas = bajas.filter(item => {
      const matchSearch = JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'Todos' || String(item.tipo?._id || item.tipo) === filterType;
      return matchSearch && matchType;
  });

  const exportarExcel = () => {
      const data = filteredBajas.map(b => ({
          Tipo: b.tipo?.nombre || 'Desconocido',
          Marca: b.marca,
          Modelo: b.modelo,
          Serial: b.serialNumber,
          Usuario: b.usuarioAsignado ? `${b.usuarioAsignado.nombre} ${b.usuarioAsignado.apellido}` : 'Sin Asignar',
          Motivo: b.detallesTecnicos?.['Motivo Baja'] || 'No especificado',
          Fecha: b.detallesTecnicos?.['Fecha Baja'] || 'N/A'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bajas");
      XLSX.writeFile(wb, "Reporte_Bajas.xlsx");
  };

  if (loading) return <div className="p-8 text-slate-500">Cargando bajas...</div>;

  return (
    <div className="p-8 text-slate-200 animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-red-400">
                <AlertCircle size={32}/> Historial de Bajas
            </h1>
            <p className="text-slate-400 mt-1">Registro de activos descartados, robados u obsoletos.</p>
        </div>
        <div className="flex items-center gap-3 bg-red-900/20 px-4 py-2 rounded-xl border border-red-500/30">
            <span className="text-2xl font-bold text-white">{filteredBajas.length}</span>
            <span className="text-xs text-red-200 uppercase font-bold tracking-wider">Total</span>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 mb-6 shadow-lg">
          <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={18}/>
              <input 
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-10 pr-4 text-white outline-none focus:border-red-500 transition-all"
                  placeholder="Buscar por motivo, modelo, serial..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500"/>
              <select 
                  className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-red-500"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
              >
                  <option value="Todos">Todos los tipos</option>
                  {tipos.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
              </select>
          </div>
          <button onClick={exportarExcel} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-all">
              <Download size={18}/> Exportar
          </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                      <th className="p-4 border-b border-slate-700">Activo</th>
                      <th className="p-4 border-b border-slate-700">Serial</th>
                      <th className="p-4 border-b border-slate-700">Usuario</th> {/* NUEVA COLUMNA */}
                      <th className="p-4 border-b border-slate-700">Motivo</th>
                      <th className="p-4 border-b border-slate-700">Fecha</th>
                      <th className="p-4 border-b border-slate-700 text-right">Acciones</th> {/* NUEVA COLUMNA */}
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                  {filteredBajas.length === 0 ? (
                      <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No se encontraron registros.</td></tr>
                  ) : (
                      filteredBajas.map(item => (
                          <tr key={item._id} className="hover:bg-slate-700/30 transition-colors group">
                              <td className="p-4">
                                  <div className="font-bold text-white">{item.marca} {item.modelo}</div>
                                  <div className="text-xs text-slate-500">{item.tipo?.nombre || 'Desconocido'}</div>
                              </td>
                              <td className="p-4 font-mono text-xs text-slate-300">{item.serialNumber}</td>
                              
                              {/* COLUMNA USUARIO */}
                              <td className="p-4">
                                  {item.usuarioAsignado ? (
                                      <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
                                              {item.usuarioAsignado.nombre[0]}
                                          </div>
                                          <div className="text-sm text-slate-300">
                                              {item.usuarioAsignado.nombre} {item.usuarioAsignado.apellido}
                                          </div>
                                      </div>
                                  ) : (
                                      <span className="text-slate-500 text-xs italic flex items-center gap-1"><User size={12}/> Sin asignar</span>
                                  )}
                              </td>

                              <td className="p-4">
                                  <div className="flex items-center gap-2 text-red-300 bg-red-900/20 px-2 py-1 rounded inline-block text-xs font-bold border border-red-500/20">
                                      <AlertTriangle size={12}/> {item.detallesTecnicos?.['Motivo Baja'] || 'Sin motivo'}
                                  </div>
                              </td>
                              <td className="p-4 text-sm text-slate-400">
                                  <div className="flex items-center gap-2">
                                      <Calendar size={14}/> {item.detallesTecnicos?.['Fecha Baja'] || 'N/A'}
                                  </div>
                              </td>

                              {/* COLUMNA ACCIONES */}
                              <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-400 hover:bg-slate-700 rounded transition-colors" title="Editar Detalles">
                                          <Pencil size={16}/>
                                      </button>
                                      <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-400 hover:bg-slate-700 rounded transition-colors" title="Eliminar Definitivamente">
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>

      {/* MODAL DE EDICIÓN (Reutilizado) */}
      <AssetModal 
        isOpen={mostrarModal} 
        onClose={() => setMostrarModal(false)} 
        asset={activoParaEditar} 
        onSave={guardarCambios}
        tipoConfig={activoParaEditar ? tipos.find(t => t._id === (activoParaEditar.tipo._id || activoParaEditar.tipo)) : null}
      />
    </div>
  );
};

export default Decommissioned;
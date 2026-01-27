import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  User, Search, ArrowLeft, Laptop, Smartphone, Headphones, 
  Monitor, Package, X, Pencil, Trash2, Save 
} from 'lucide-react';

const UserAssignments = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); 
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAssets, setUserAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [tempAssetData, setTempAssetData] = useState({ marca: '', modelo: '', serialNumber: '', estado: '' });
  const [tempDetalles, setTempDetalles] = useState({});

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsuarios(res.data);
    } catch (e) { console.error(e); }
  };

  const verPerfil = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/assets');
      const asignados = res.data.filter(a => (a.usuarioAsignado?._id || a.usuarioAsignado) === user._id);
      setUserAssets(asignados);
      setViewMode('profile');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const abrirModalEdicion = (asset) => {
    setEditingAsset(asset);
    setTempAssetData({
      marca: asset.marca || '',
      modelo: asset.modelo || '',
      serialNumber: asset.serialNumber || '',
      estado: asset.estado || 'Asignado'
    });
    setTempDetalles(asset.detallesTecnicos || {});
    setShowEditModal(true);
  };

  const guardarCambiosActivo = async () => {
    try {
      const body = { ...tempAssetData, detallesTecnicos: tempDetalles };
      await axios.put(`http://localhost:5000/api/assets/${editingAsset._id}`, body);
      setShowEditModal(false);
      verPerfil(selectedUser);
    } catch (e) { alert("Error al actualizar"); }
  };

  const getIcon = (typeName) => {
    const n = typeName?.toLowerCase() || '';
    if (n.includes('laptop')) return <Laptop size={18} className="text-blue-400" />;
    if (n.includes('celular')) return <Smartphone size={18} className="text-green-400" />;
    if (n.includes('monitor')) return <Monitor size={18} className="text-purple-400" />;
    if (n.includes('auricular')) return <Headphones size={18} className="text-orange-400" />;
    return <Package size={18} className="text-slate-500" />;
  };

  const usuariosFiltrados = usuarios.filter(u => 
    `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 pb-24 text-slate-200 animate-fade-in">
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => viewMode === 'profile' ? setViewMode('list') : navigate(-1)} 
          className="p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 hover:text-white transition-all shadow-lg active:scale-90"
        >
          <ArrowLeft size={20}/>
        </button>
        <h1 className="text-3xl font-bold flex gap-3 items-center">
          {viewMode === 'list' ? 'Asignaciones por Usuario' : `Perfil de ${selectedUser.nombre}`}
        </h1>
      </div>

      {viewMode === 'list' ? (
        <div className="animate-fade-in">
          <div className="relative w-full max-w-md mb-8 shadow-2xl">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18}/>
            <input 
              className="w-full bg-slate-800 border border-slate-700 p-2.5 pl-10 rounded-lg outline-none focus:border-blue-500 transition-all"
              placeholder="Buscar por usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuariosFiltrados.map(u => (
              <div 
                key={u._id} 
                onClick={() => verPerfil(u)}
                className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-4 group shadow-md"
              >
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <User size={24}/>
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{u.nombre} {u.apellido}</h3>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-slate-800 p-8 rounded-2xl border border-slate-700 h-fit shadow-2xl">
                 <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500 mb-4 shadow-inner">
                        <User size={48}/>
                    </div>
                    <h2 className="text-2xl font-bold text-white">{selectedUser.nombre} {selectedUser.apellido}</h2>
                    <p className="text-slate-400 mb-6 font-mono text-sm">{selectedUser.email}</p>
                    <div className="w-full bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Activos Totales</p>
                        <p className="text-3xl font-bold text-blue-400">{userAssets.length}</p>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Package className="text-blue-500"/> Inventario Asignado
                </h2>
                {userAssets.length === 0 ? (
                  <div className="bg-slate-800/50 border border-dashed border-slate-700 p-12 rounded-2xl text-center text-slate-500 italic animate-fade-in">
                    No tiene activos asignados actualmente.
                  </div>
                ) : (
                  userAssets.map(a => (
                    <div key={a._id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl flex items-center justify-between hover:border-slate-500 transition-all shadow-md group">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 rounded-lg group-hover:bg-blue-600/10 transition-colors">
                                {getIcon(a.tipo?.nombre)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded uppercase">{a.tipo?.nombre}</span>
                                  <span className="text-xs font-mono text-slate-500">{a.serialNumber}</span>
                                </div>
                                <h4 className="font-bold text-white">{a.marca} {a.modelo}</h4>
                            </div>
                        </div>
                        <button 
                          onClick={() => abrirModalEdicion(a)}
                          className="p-3 bg-slate-700 hover:bg-blue-600 rounded-xl text-white transition-all active:scale-90"
                        >
                          <Pencil size={18}/>
                        </button>
                    </div>
                  ))
                )}
            </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden scale-in-center">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-xl font-bold">Editar {editingAsset.tipo?.nombre}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-full transition-all"><X size={20}/></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold mb-1 block">MARCA</label>
                  <input className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all" value={tempAssetData.marca} onChange={e => setTempAssetData({...tempAssetData, marca: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold mb-1 block">MODELO</label>
                  <input className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all" value={tempAssetData.modelo} onChange={e => setTempAssetData({...tempAssetData, modelo: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold mb-1 block">S/N</label>
                  <input className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-blue-500 font-mono transition-all" value={tempAssetData.serialNumber} onChange={e => setTempAssetData({...tempAssetData, serialNumber: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold mb-1 block">ESTADO</label>
                  <select className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all" value={tempAssetData.estado} onChange={e => setTempAssetData({...tempAssetData, estado: e.target.value})}>
                    <option value="Asignado">Asignado</option>
                    <option value="Disponible">Disponible (Liberar)</option>
                    <option value="Reparación">En Reparación</option>
                    <option value="Baja">Baja Definitiva</option>
                  </select>
                </div>
                {Object.keys(tempDetalles).length > 0 && (
                  <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-700">
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-4 tracking-widest">Especificaciones</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(tempDetalles).map(([key, val]) => (
                        <div key={key}>
                          <label className="text-[10px] text-slate-500 font-bold mb-1 block uppercase">{key}</label>
                          <input className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-white outline-none focus:border-blue-500 transition-all" value={val} onChange={e => setTempDetalles({...tempDetalles, [key]: e.target.value})} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-900/20">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-all">Cancelar</button>
              <button onClick={guardarCambiosActivo} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"><Save size={18}/> Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAssignments;
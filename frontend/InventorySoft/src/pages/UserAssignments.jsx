import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  User, Package, Calendar, Key, Monitor, Smartphone, 
  Search, ArrowRight, Laptop, Headphones, MousePointer2, Pencil, X, AlertCircle
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import AssetModal from '../components/AssetModal'; // Asegúrate de que este archivo exista

const API_URL = window.location.hostname.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : 'https://itsoft-backend.onrender.com/api';

const UserAssignments = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAssets, setUserAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Estados para el Modal de Edición
  const [assetParaEditar, setAssetParaEditar] = useState(null);
  const [mostrarAssetModal, setMostrarAssetModal] = useState(false);
  const [allTypes, setAllTypes] = useState([]);

  useEffect(() => {
    cargarUsuarios();
    cargarTipos();
  }, []);

  const cargarUsuarios = async () => {
    const token = localStorage.getItem('token');
    try {
        const res = await axios.get(`${API_URL}/users`, { headers: { 'x-auth-token': token } });
        setUsers(res.data);
    } catch (e) { console.error(e); }
  };

  const cargarTipos = async () => {
      const token = localStorage.getItem('token');
      try {
          const res = await axios.get(`${API_URL}/asset-types`, { headers: { 'x-auth-token': token } });
          setAllTypes(res.data || []);
      } catch (e) { console.error(e); }
  };

  const cargarActivosUsuario = async (userId) => {
    setLoadingAssets(true);
    const token = localStorage.getItem('token');
    try {
        const res = await axios.get(`${API_URL}/assets`, { headers: { 'x-auth-token': token } });
        // Filtramos los activos que pertenecen al usuario seleccionado
        const assigned = res.data.filter(a => a.usuarioAsignado && (a.usuarioAsignado._id === userId || a.usuarioAsignado === userId));
        setUserAssets(assigned);
    } catch (e) { console.error(e); }
    finally { setLoadingAssets(false); }
  };

  const handleUserClick = (u) => {
      setSelectedUser(u);
      cargarActivosUsuario(u._id);
  };

  // --- LÓGICA DE EDICIÓN (ABRIR MODAL) ---
  const handleEditAsset = (asset) => {
      setAssetParaEditar(asset);
      setMostrarAssetModal(true);
  };

  // --- LÓGICA DE GUARDADO DESDE EL MODAL ---
  const handleSaveAsset = async (id, data) => {
      const token = localStorage.getItem('token');
      try {
          // Preparamos el objeto, limpiando redundancias
          const body = { ...data, detallesTecnicos: { ...data } };
          delete body.detallesTecnicos.marca;
          delete body.detallesTecnicos.modelo;
          delete body.detallesTecnicos.serialNumber;
          delete body.detallesTecnicos.estado;

          await axios.put(`${API_URL}/assets/${id}`, body, { headers: { 'x-auth-token': token } });
          
          setMostrarAssetModal(false);
          cargarActivosUsuario(selectedUser._id); // Recargar lista
          alert("Activo actualizado correctamente.");
      } catch (e) { 
          alert("Error al actualizar: " + (e.response?.data?.message || e.message)); 
      }
  };

  // --- LÓGICA DE DESASIGNAR (BOTÓN X) ---
  const handleUnassign = async (asset) => {
      if(!window.confirm(`¿Quitar ${asset.marca} ${asset.modelo} a este usuario?`)) return;
      
      const token = localStorage.getItem('token');
      try {
          // Devolvemos el activo a estado 'Disponible' y quitamos el usuario
          await axios.put(`${API_URL}/assets/${asset._id}`, {
              estado: 'Disponible',
              usuarioAsignado: null,
              // Opcional: Podrías guardar un historial en detallesTecnicos de cuándo se devolvió
          }, { headers: { 'x-auth-token': token } });
          
          cargarActivosUsuario(selectedUser._id); // Recargar para que desaparezca de la lista
      } catch(e) { 
          alert("Error al desasignar."); 
      }
  };

  const getAssetIcon = (name) => {
      const n = name?.toLowerCase() || '';
      if (n.includes('licencia') || n.includes('software')) return <Key size={24} className="text-yellow-400"/>;
      if (n.includes('laptop') || n.includes('notebook')) return <Laptop size={24} className="text-blue-400"/>;
      if (n.includes('celular') || n.includes('iphone')) return <Smartphone size={24} className="text-green-400"/>;
      if (n.includes('auricular')) return <Headphones size={24} className="text-pink-400"/>;
      if (n.includes('mouse')) return <MousePointer2 size={24} className="text-orange-400"/>;
      return <Package size={24} className="text-slate-400"/>;
  };

  const filteredUsers = users.filter(u => 
      `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 text-slate-200 animate-fade-in h-[calc(100vh-64px)] flex flex-col">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <User size={32} className="text-blue-500"/> Asignaciones por Usuario
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        
        {/* LISTA DE USUARIOS (IZQUIERDA) */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-500" size={18}/>
                    <input 
                        className="w-full bg-slate-800 border border-slate-600 rounded-xl py-2.5 pl-10 pr-4 text-white outline-none focus:border-blue-500 transition-all"
                        placeholder="Buscar empleado..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filteredUsers.map(u => (
                    <div 
                        key={u._id} 
                        onClick={() => handleUserClick(u)}
                        className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${selectedUser?._id === u._id ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-700'}`}
                    >
                        <UserAvatar user={u} size={40} className="border border-white/20"/>
                        <div className="overflow-hidden">
                            <p className="font-bold text-sm truncate text-white">{u.nombre} {u.apellido}</p>
                            <p className={`text-xs truncate ${selectedUser?._id === u._id ? 'text-blue-200' : 'text-slate-400'}`}>{u.cargo || 'Sin cargo'}</p>
                        </div>
                        {selectedUser?._id === u._id && <ArrowRight size={16} className="ml-auto text-white"/>}
                    </div>
                ))}
            </div>
        </div>

        {/* DETALLE DE ACTIVOS (DERECHA) */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col shadow-xl overflow-hidden relative">
            {!selectedUser ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                    <User size={64} className="mb-4 stroke-1"/>
                    <p className="text-lg">Selecciona un usuario para ver sus activos</p>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    {/* CABECERA DEL USUARIO SELECCIONADO */}
                    <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex items-center gap-6">
                        <UserAvatar user={selectedUser} size={80} className="border-4 border-slate-700 shadow-2xl"/>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedUser.nombre} {selectedUser.apellido}</h2>
                            <p className="text-blue-400 font-mono text-sm mb-1">{selectedUser.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-600">{selectedUser.area || 'General'}</span>
                                <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-bold text-slate-300 border border-slate-600">{selectedUser.cargo || 'Empleado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* LISTA DE ACTIVOS DEL USUARIO */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-800/50">
                        {loadingAssets ? <p className="text-center p-10 text-slate-500 animate-pulse">Cargando activos...</p> : 
                         userAssets.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-2xl">
                                <Package size={48} className="mx-auto text-slate-600 mb-2"/>
                                <p className="text-slate-500">Este usuario no tiene activos asignados.</p>
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userAssets.map(asset => {
                                    // Detectar si es licencia para mostrar datos extra
                                    const esLicencia = asset.marca?.toLowerCase().includes('licencia') || asset.modelo?.toLowerCase().includes('licencia') || (asset.tipo?.nombre || '').toLowerCase().includes('licencia');
                                    const clave = asset.detallesTecnicos?.['Clave'] || asset.detallesTecnicos?.['Key'] || asset.detallesTecnicos?.['Serial'];
                                    
                                    // Nombre inteligente
                                    const nombreDisplay = asset.detallesTecnicos?.['Software'] || asset.detallesTecnicos?.['Nombre'] || `${asset.marca} ${asset.modelo}`;

                                    return (
                                        <div key={asset._id} className="bg-slate-700/40 border border-slate-600/50 p-4 rounded-xl hover:bg-slate-700 transition-all hover:shadow-lg group relative">
                                            
                                            {/* BOTONES DE ACCIÓN FLOTANTES */}
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                                <button onClick={(e) => {e.stopPropagation(); handleEditAsset(asset)}} className="p-1.5 bg-slate-800 text-blue-400 rounded-lg hover:text-white hover:bg-blue-600 shadow-md border border-slate-600" title="Ver/Editar Detalles">
                                                    <Pencil size={14}/>
                                                </button>
                                                <button onClick={(e) => {e.stopPropagation(); handleUnassign(asset)}} className="p-1.5 bg-slate-800 text-red-400 rounded-lg hover:text-white hover:bg-red-600 shadow-md border border-slate-600" title="Desasignar / Devolver">
                                                    <X size={14}/>
                                                </button>
                                            </div>

                                            <div className="flex justify-between items-start mb-3">
                                                <div className="p-3 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform shadow-md">
                                                    {getAssetIcon(esLicencia ? 'licencia' : asset.modelo)}
                                                </div>
                                            </div>
                                            
                                            <h3 className="font-bold text-lg text-white mb-1 truncate" title={nombreDisplay}>
                                                {nombreDisplay}
                                            </h3>
                                            
                                            <div className="space-y-1 mt-3">
                                                <p className="text-xs text-slate-400 font-mono bg-slate-800/50 p-1.5 rounded flex justify-between items-center">
                                                    <span>S/N:</span> <span className="text-slate-200 select-all truncate max-w-[120px]">{asset.serialNumber}</span>
                                                </p>
                                                
                                                {esLicencia && clave && (
                                                    <p className="text-xs text-yellow-500/80 font-mono bg-yellow-900/10 p-1.5 rounded flex justify-between border border-yellow-500/20">
                                                        <span>Clave:</span> <span className="text-yellow-200 select-all font-bold truncate max-w-[120px]">{clave}</span>
                                                    </p>
                                                )}

                                                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                                                    <Calendar size={10}/> Asignado: {asset.detallesTecnicos?.['Fecha Asignación'] || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                         )
                        }
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* MODAL DE EDICIÓN REUTILIZADO */}
      <AssetModal 
        isOpen={mostrarAssetModal} 
        onClose={() => setMostrarAssetModal(false)} 
        asset={assetParaEditar} 
        onSave={handleSaveAsset} 
        tipoConfig={allTypes.find(t => t._id === (assetParaEditar?.tipo?._id || assetParaEditar?.tipo))}
      />
    </div>
  );
};

export default UserAssignments;
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  User, Search, ArrowLeft, Laptop, Smartphone, Headphones, 
  Monitor, Package, X, Trash2, RotateCcw, AlertTriangle, Calendar, Pencil
} from 'lucide-react';

const UserAssignments = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); 
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAssets, setUserAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [accionBaja, setAccionBaja] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('');

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get('https://itsoft-backend.onrender.com/api/users');
      setUsuarios(res.data);
    } catch (e) { console.error(e); }
  };

  const verPerfil = async (user) => {
    setSelectedUser(user);
    try {
      const res = await axios.get('https://itsoft-backend.onrender.com/api/assets');
      const asignados = res.data.filter(a => (a.usuarioAsignado?._id || a.usuarioAsignado) === user._id && a.estado !== 'Baja');
      setUserAssets(asignados);
      setViewMode('profile');
    } catch (e) { console.error(e); }
  };

  const handleDevolver = async () => {
    if (!window.confirm("¿Confirmar devolución?")) return;
    try {
        // Verificar si es consumible (tiene Stock maestro)
        const res = await axios.get('https://itsoft-backend.onrender.com/api/assets');
        const modeloMaestro = res.data.find(a => a.marca === selectedAsset.marca && a.modelo === selectedAsset.modelo && a.detallesTecnicos.hasOwnProperty('Stock'));

        if (modeloMaestro) {
            const stockActual = parseInt(modeloMaestro.detallesTecnicos['Stock'] || 0);
            await axios.put(`https://itsoft-backend.onrender.com/api/assets/${modeloMaestro._id}`, {
                detallesTecnicos: { ...modeloMaestro.detallesTecnicos, 'Stock': stockActual + 1 }
            });
            await axios.delete(`https://itsoft-backend.onrender.com/api/assets/${selectedAsset._id}`);
        } else {
            // Si no es consumible, solo le quitamos el usuario
            await axios.put(`https://itsoft-backend.onrender.com/api/assets/${selectedAsset._id}`, { 
                usuarioAsignado: null, 
                estado: 'Disponible' 
            });
        }
        alert("Activo devuelto.");
        setShowManageModal(false);
        verPerfil(selectedUser);
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleBaja = async () => {
      if (!motivoBaja) return alert("Escribe el motivo");
      try {
          await axios.put(`https://itsoft-backend.onrender.com/api/assets/${selectedAsset._id}`, {
              estado: 'Baja',
              detallesTecnicos: { ...selectedAsset.detallesTecnicos, 'Motivo Baja': motivoBaja, 'Fecha Baja': new Date().toISOString().split('T')[0] }
          });
          alert("Activo dado de baja.");
          setShowManageModal(false);
          verPerfil(selectedUser);
      } catch (e) { alert("Error: " + e.message); }
  };

  const getIcon = (typeName) => {
    const n = typeName?.toLowerCase() || '';
    if (n.includes('laptop')) return <Laptop size={18} className="text-blue-400" />;
    if (n.includes('celular')) return <Smartphone size={18} className="text-green-400" />;
    if (n.includes('auricular')) return <Headphones size={18} className="text-orange-400" />;
    return <Package size={18} className="text-slate-500" />;
  };

  return (
    <div className="p-8 pb-24 text-slate-200 animate-fade-in">
      {/* ... (CABECERA Y BUSQUEDA IGUAL QUE ANTES) ... */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => viewMode === 'profile' ? setViewMode('list') : navigate(-1)} className="p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-all shadow-lg"><ArrowLeft size={20}/></button>
        <h1 className="text-3xl font-bold flex gap-3 items-center">{viewMode === 'list' ? 'Asignaciones por Usuario' : `Perfil de ${selectedUser.nombre}`}</h1>
      </div>

      {viewMode === 'list' ? (
        <div className="animate-fade-in">
          <div className="relative w-full max-w-md mb-8 shadow-2xl">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={18}/>
            <input className="w-full bg-slate-800 border border-slate-700 p-2.5 pl-10 rounded-lg outline-none focus:border-blue-500" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuarios.filter(u => `${u.nombre} ${u.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
              <div key={u._id} onClick={() => verPerfil(u)} className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer transition-all flex items-center gap-4 group">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-blue-400 group-hover:text-white"><User size={24}/></div>
                <div><h3 className="font-bold text-white">{u.nombre} {u.apellido}</h3><p className="text-xs text-slate-500">{u.email}</p></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-slate-800 p-8 rounded-2xl border border-slate-700 h-fit shadow-2xl">
                 <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-500 mb-4"><User size={48}/></div>
                    <h2 className="text-2xl font-bold text-white">{selectedUser.nombre} {selectedUser.apellido}</h2>
                    <p className="text-slate-400 mb-6 font-mono text-sm">{selectedUser.email}</p>
                    <div className="w-full bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Activos Asignados</p>
                        <p className="text-3xl font-bold text-blue-400">{userAssets.length}</p>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Package className="text-blue-500"/> Inventario en Poder</h2>
                {userAssets.map(a => {
                    // LÓGICA CONDICIONAL: ¿ES CONSUMIBLE (GENÉRICO) O ACTIVO FIJO (LAPTOP)?
                    const esConsumible = a.serialNumber?.startsWith('STK-') || a.serialNumber?.startsWith('ASG-');
                    
                    return (
                        <div key={a._id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl flex items-center justify-between hover:border-slate-500 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900 rounded-lg">{getIcon(a.tipo?.nombre)}</div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-bold bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded uppercase">{a.tipo?.nombre}</span>
                                      {!esConsumible && <span className="text-xs font-mono text-slate-500">{a.serialNumber}</span>}
                                    </div>
                                    <h4 className="font-bold text-white">{a.marca} {a.modelo}</h4>
                                </div>
                            </div>
                            
                            {/* BOTONES DIFERENTES SEGUN TIPO */}
                            {esConsumible ? (
                                <button onClick={() => { setSelectedAsset(a); setShowManageModal(true); setAccionBaja(false); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white font-medium transition-all">
                                  Gestionar
                                </button>
                            ) : (
                                <button onClick={() => { 
                                    // Para laptops, comportamiento "Lápiz" (Editar/Desvincular rápido)
                                    if(window.confirm("¿Desvincular este activo del usuario?")) {
                                        axios.put(`https://itsoft-backend.onrender.com/api/assets/${a._id}`, { usuarioAsignado: null, estado: 'Disponible' }).then(() => verPerfil(selectedUser));
                                    }
                                }} className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all">
                                  <Pencil size={18}/>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* MODAL GESTIONAR (SOLO PARA CONSUMIBLES) */}
      {showManageModal && selectedAsset && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowManageModal(false)}></div>
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between">
              <h3 className="text-xl font-bold text-white">Gestionar Activo</h3>
              <button onClick={() => setShowManageModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-6">
                {!accionBaja ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleDevolver} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl flex flex-col items-center gap-2"><RotateCcw size={24}/><span className="font-bold text-sm">Devolver</span></button>
                        <button onClick={() => setAccionBaja(true)} className="bg-slate-700 hover:bg-red-900/50 hover:text-red-400 text-slate-300 p-4 rounded-xl flex flex-col items-center gap-2"><AlertTriangle size={24}/><span className="font-bold text-sm">Dar de Baja</span></button>
                    </div>
                ) : (
                    <div>
                        <input className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-sm mb-4" placeholder="Motivo de baja..." value={motivoBaja} onChange={e => setMotivoBaja(e.target.value)} autoFocus/>
                        <div className="flex gap-3"><button onClick={() => setAccionBaja(false)} className="flex-1 py-2 text-slate-400">Atrás</button><button onClick={handleBaja} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold">Confirmar</button></div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAssignments;
import { useState, useEffect } from 'react';
import { 
  X, Save, Laptop, Monitor, Smartphone, Tablet, 
  HardDrive, Cpu, Command, Terminal, Hash, Tag, AlertCircle, Calendar
} from 'lucide-react';

const AssetModal = ({ isOpen, onClose, asset, onSave, tipoConfig }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (asset) {
        // Aplanamos los datos para el formulario
        const datos = {
            marca: asset.marca,
            modelo: asset.modelo,
            serialNumber: asset.serialNumber,
            estado: asset.estado,
            ...asset.detallesTecnicos
        };
        setFormData(datos);
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleChange = (key, value) => {
      setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
      // Si el estado es Baja, aseguramos que la fecha esté seteada si el usuario no la tocó
      if (formData.estado === 'Baja' && !formData['Fecha Baja']) {
          formData['Fecha Baja'] = new Date().toISOString().split('T')[0];
      }
      onSave(asset._id, formData);
  };

  // --- LÓGICA VISUAL ---
  const so = (formData['SO'] || formData['Sistema Operativo'] || '').toLowerCase();
  
  let OSIcon = Monitor;
  let osColor = "text-blue-400";
  let osName = "Sistema Desconocido";

  if (so.includes('win')) { OSIcon = Monitor; osColor = "text-blue-500"; osName = "Windows"; }
  else if (so.includes('mac') || so.includes('os x')) { OSIcon = Command; osColor = "text-white"; osName = "macOS"; }
  else if (so.includes('linux') || so.includes('ubuntu')) { OSIcon = Terminal; osColor = "text-yellow-500"; osName = "Linux"; }
  else if (so.includes('android')) { OSIcon = Smartphone; osColor = "text-green-500"; osName = "Android"; }
  else if (so.includes('ios')) { OSIcon = Smartphone; osColor = "text-gray-200"; osName = "iOS"; }

  const getMainIcon = () => {
      const tipo = (asset.tipo?.nombre || '').toLowerCase();
      if (tipo.includes('laptop')) return <Laptop size={64} className="text-slate-200 drop-shadow-2xl"/>;
      if (tipo.includes('celular')) return <Smartphone size={64} className="text-slate-200 drop-shadow-2xl"/>;
      if (tipo.includes('auricular')) return <div className="text-slate-200 drop-shadow-2xl text-6xl">🎧</div>; // Icono simple si no hay SVG
      return <Laptop size={64} className="text-slate-200 drop-shadow-2xl"/>;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            {/* COLUMNA IZQUIERDA: VISUAL */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-700 md:w-1/3 text-center">
                <div className="mb-6 p-6 bg-slate-800 rounded-full shadow-inner border border-slate-700">
                    {getMainIcon()}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{formData.marca || 'Genérico'}</h2>
                <p className="text-sm text-slate-400 font-medium mb-4">{formData.modelo || 'Modelo'}</p>
                
                {/* Badge SO (Solo si existe el campo) */}
                {(formData['SO'] || formData['Sistema Operativo']) && (
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                        <OSIcon size={14} className={osColor}/>
                        <span className="text-xs font-bold text-slate-300">{formData['SO'] || formData['Sistema Operativo']}</span>
                    </div>
                )}

                <div className="mt-6 space-y-2 w-full text-left">
                    {formData['Procesador'] && <div className="flex items-center gap-2 text-xs text-slate-400"><Cpu size={12}/> <span className="truncate">{formData['Procesador']}</span></div>}
                    {formData['Ram'] && <div className="flex items-center gap-2 text-xs text-slate-400"><HardDrive size={12}/> <span>{formData['Ram']}</span></div>}
                </div>
            </div>

            {/* COLUMNA DERECHA: EDICIÓN */}
            <div className="flex-1 p-6 md:p-8 bg-slate-900 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Tag size={18} className="text-blue-500"/> Información del Activo</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Serial Number</label>
                            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-2.5">
                                <Hash size={16} className="text-slate-500 mr-2"/>
                                <input className="bg-transparent w-full text-white text-sm outline-none font-mono" value={formData.serialNumber || ''} onChange={e => handleChange('serialNumber', e.target.value)}/>
                            </div>
                        </div>
                        
                        {/* Campos Dinámicos */}
                        {tipoConfig?.campos?.map((campo, idx) => {
                            if (['Marca', 'Modelo', 'Serial Number', 'Usuario Asignado', 'Stock'].includes(campo.nombreEtiqueta)) return null;
                            return (
                                <div key={idx} className={campo.tipoDato === 'text' ? 'col-span-2' : 'col-span-1'}>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{campo.nombreEtiqueta}</label>
                                    <input 
                                        type={campo.tipoDato === 'date' ? 'date' : 'text'}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500 transition-all"
                                        value={formData[campo.nombreEtiqueta] || ''}
                                        onChange={e => handleChange(campo.nombreEtiqueta, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                        
                        {/* ESTADO */}
                        <div className="col-span-2 pt-2 border-t border-slate-800 mt-2">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Estado Actual</label>
                            <select 
                                className={`w-full border rounded-lg p-2.5 text-white text-sm outline-none transition-all ${formData.estado === 'Baja' ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-slate-800 border-slate-700 focus:border-blue-500'}`}
                                value={formData.estado || 'Disponible'}
                                onChange={e => handleChange('estado', e.target.value)}
                            >
                                <option value="Disponible">Disponible</option>
                                <option value="Asignado">Asignado</option>
                                <option value="Reparación">En Reparación</option>
                                <option value="Baja">Dado de Baja (Descarte/Robo)</option>
                            </select>
                        </div>

                        {/* --- CAMPOS EXTRA SI ES BAJA (AQUÍ ESTÁ LA MAGIA) --- */}
                        {formData.estado === 'Baja' && (
                            <div className="col-span-2 bg-red-900/10 border border-red-500/30 rounded-xl p-4 animate-fade-in grid grid-cols-2 gap-4">
                                <div className="col-span-2 flex items-center gap-2 text-red-400 mb-1">
                                    <AlertCircle size={16}/> <span className="text-xs font-bold uppercase">Detalles de la Baja</span>
                                </div>
                                
                                <div className="col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Motivo</label>
                                    <input 
                                        className="w-full bg-slate-900 border border-red-500/30 rounded-lg p-2.5 text-white text-sm focus:border-red-500 outline-none"
                                        placeholder="Ej: Roto, Obsoleto, Robado..."
                                        value={formData['Motivo Baja'] || ''}
                                        onChange={e => handleChange('Motivo Baja', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Fecha de Baja</label>
                                    <div className="flex items-center bg-slate-900 border border-red-500/30 rounded-lg p-2.5">
                                        <Calendar size={16} className="text-red-400 mr-2"/>
                                        <input 
                                            type="date"
                                            className="bg-transparent w-full text-white text-sm outline-none"
                                            value={formData['Fecha Baja'] || new Date().toISOString().split('T')[0]}
                                            onChange={e => handleChange('Fecha Baja', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* ----------------------------------------------------- */}

                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">Cancelar</button>
                    <button onClick={handleSave} className={`px-6 py-2 rounded-xl text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 text-white ${formData.estado === 'Baja' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}>
                        <Save size={16}/> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AssetModal;
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings as SettingsIcon, Database, Plus, Trash2, Save, X, Tag, 
  CheckSquare, List, Calendar, Type, Hash, User, GripVertical, Box
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('activos');
  const [tipos, setTipos] = useState([]);
  const [editingType, setEditingType] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [dropdownOptions, setDropdownOptions] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  useEffect(() => { cargarTipos(); }, []);

  const cargarTipos = async () => { 
    try { 
      const res = await axios.get('http://localhost:5000/api/asset-types'); 
      setTipos(res.data); 
    } catch (e) { console.error(e); } 
  };

  const startEdit = (t) => {
    setEditingType({ ...t });
    setIsCreating(false); 
    setNewFieldLabel('');
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return alert("Nombre requerido");
    let opts = [];
    if (newFieldType === 'dropdown' && dropdownOptions) {
      opts = dropdownOptions.split(',').map(o => o.trim()).filter(Boolean);
    }
    const nuevoCampo = { nombreEtiqueta: newFieldLabel, tipoDato: newFieldType, opciones: opts };
    setEditingType({ ...editingType, campos: [...(editingType.campos || []), nuevoCampo] });
    setNewFieldLabel(''); setDropdownOptions('');
  };

  // --- BOTONES RÁPIDOS PARA CAMPOS ESPECIALES ---
  const agregarCampoEspecial = (tipo) => {
      let campo = {};
      if (tipo === 'stock') {
          campo = { nombreEtiqueta: 'Stock', tipoDato: 'number', opciones: [] };
      } else if (tipo === 'usuario') {
          campo = { nombreEtiqueta: 'Usuario Asignado', tipoDato: 'text', opciones: [] }; // Se guarda como texto para no romper backend
      }
      setEditingType({ ...editingType, campos: [...(editingType.campos || []), campo] });
  };

  // --- DRAG & DROP ---
  const onDragStart = (index) => setDraggedItemIndex(index);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (index) => {
    if (draggedItemIndex === null) return;
    const camposCopia = [...editingType.campos];
    const itemArrastrado = camposCopia[draggedItemIndex];
    camposCopia.splice(draggedItemIndex, 1);
    camposCopia.splice(index, 0, itemArrastrado);
    setEditingType({ ...editingType, campos: camposCopia });
    setDraggedItemIndex(null);
  };

  const handleSaveType = async () => {
    if (!editingType.nombre) return alert("Nombre obligatorio");
    try {
      if (isCreating) await axios.post('http://localhost:5000/api/asset-types', editingType);
      else await axios.put(`http://localhost:5000/api/asset-types/${editingType._id}`, editingType);
      setEditingType(null); setIsCreating(false); cargarTipos();
    } catch (e) { alert("Error al guardar: " + (e.response?.data?.message || e.message)); }
  };

  const getTypeIcon = (type, label) => {
      if(label === 'Stock') return <Box size={14} className="text-green-400"/>;
      if(label === 'Usuario Asignado') return <User size={14} className="text-blue-400"/>;
      if(type === 'text') return <Type size={14}/>;
      if(type === 'number') return <Hash size={14}/>;
      if(type === 'date') return <Calendar size={14}/>;
      if(type === 'dropdown') return <List size={14}/>;
      if(type === 'checkbox') return <CheckSquare size={14}/>;
      return <Tag size={14}/>;
  };

  return (
    <div className="p-8 pb-24 text-slate-200 h-screen flex flex-col animate-fade-in">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-8"><SettingsIcon className="text-slate-400"/> Configuración</h1>
      <div className="flex flex-1 gap-8">
        <div className="w-64 bg-slate-800 rounded-xl border border-slate-700 h-fit overflow-hidden">
          <button className="w-full text-left p-4 flex items-center gap-3 bg-blue-600 text-white"><Database size={18}/> Tipos de Activos</button>
        </div>

        <div className="flex-1">
          {activeTab === 'activos' && !editingType && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Modelos de Activos</h2>
                <button onClick={() => { setEditingType({ nombre: '', campos: [] }); setIsCreating(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg"><Plus size={18}/> Crear Nuevo</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tipos.map(t => (
                  <div key={t._id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl hover:border-blue-500 group relative shadow-lg transition-all hover:-translate-y-1">
                    <div className="flex justify-between mb-3"><h3 className="font-bold text-lg text-white">{t.nombre}</h3><button onClick={() => { if(window.confirm('¿Borrar?')) axios.delete('http://localhost:5000/api/asset-types/'+t._id).then(cargarTipos) }} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16}/></button></div>
                    <div className="text-xs text-slate-500 mb-4">{t.campos?.length || 0} campos configurados</div>
                    <button onClick={() => startEdit(t)} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium text-white transition-colors">Editar Campos</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activos' && editingType && (
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl animate-fade-in">
                <div className="flex justify-between mb-6 border-b border-slate-700 pb-4">
                  <h2 className="text-2xl font-bold text-white">{isCreating ? 'Nuevo Modelo' : `Editando: ${editingType.nombre}`}</h2>
                  <button onClick={() => setEditingType(null)} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nombre del Modelo</label>
                      <input className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white mb-4 outline-none focus:border-blue-500 transition-all" value={editingType.nombre} onChange={(e) => setEditingType({...editingType, nombre: e.target.value})} placeholder="Ej: Auriculares..."/>
                      <div className="text-xs text-slate-500 p-3 bg-blue-900/10 border border-blue-900/30 rounded italic">Arrastra los campos para ordenar.</div>
                    </div>

                    <div className="md:col-span-2 bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white">Campos</h3>
                            <div className="flex gap-2">
                                <button onClick={() => agregarCampoEspecial('stock')} className="text-xs bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1">+ Stock</button>
                                <button onClick={() => agregarCampoEspecial('usuario')} className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1">+ Usuario</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-2 mb-6 bg-slate-800 p-3 rounded border border-slate-600">
                            <div className="col-span-4"><input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-blue-500" placeholder="Nombre Campo" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)}/></div>
                            <div className="col-span-3">
                              <select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-blue-500" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
                                <option value="text">Texto</option>
                                <option value="number">Número</option>
                                <option value="date">Fecha</option>
                                <option value="dropdown">Lista Desplegable</option>
                                <option value="checkbox">Casilla</option>
                              </select>
                            </div>
                            <div className="col-span-4">{newFieldType === 'dropdown' ? (<input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm outline-none focus:border-blue-500" placeholder="Opc1, Opc2..." value={dropdownOptions} onChange={(e) => setDropdownOptions(e.target.value)}/>) : <div className="text-xs text-slate-600 flex items-center h-full pl-2 italic">Sin config.</div>}</div>
                            <div className="col-span-1 flex justify-end"><button onClick={handleAddField} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded w-full flex justify-center items-center transition-all shadow-md active:scale-95"><Plus size={18}/></button></div>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                            {editingType.campos?.map((campo, index) => (
                                <div key={index} draggable onDragStart={() => onDragStart(index)} onDragOver={onDragOver} onDrop={() => onDrop(index)} className={`flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700 hover:border-blue-500 transition-all cursor-move ${draggedItemIndex === index ? 'opacity-50 border-dashed border-blue-500' : ''}`}>
                                    <div className="flex items-center gap-3">
                                      <GripVertical size={16} className="text-slate-600"/>
                                      <div className="p-2 bg-slate-900 rounded text-blue-400">{getTypeIcon(campo.tipoDato, campo.nombreEtiqueta)}</div>
                                      <div><p className="font-bold text-white text-sm">{campo.nombreEtiqueta}</p><p className="text-[10px] text-slate-500 uppercase">{campo.tipoDato}</p></div>
                                    </div>
                                    <button onClick={() => setEditingType({...editingType, campos: editingType.campos.filter((_, i) => i !== index)})} className="text-slate-500 hover:text-red-400 p-2 transition-colors hover:bg-slate-700 rounded-full"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-700"><button onClick={() => setEditingType(null)} className="px-6 py-2 text-slate-400 hover:text-white transition-colors">Cancelar</button><button onClick={handleSaveType} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold flex gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20"><Save size={18}/> Guardar Cambios</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
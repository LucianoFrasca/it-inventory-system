import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings as SettingsIcon, Database, Plus, Trash2, Save, X, Tag, 
  CheckSquare, List, Calendar, Type, Hash, User 
} from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('activos');
  const [tipos, setTipos] = useState([]);
  const [editingType, setEditingType] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [dropdownOptions, setDropdownOptions] = useState('');

  const BASE_FIELDS = [
    { nombreEtiqueta: 'Marca', tipoDato: 'text' },
    { nombreEtiqueta: 'Modelo', tipoDato: 'text' },
    { nombreEtiqueta: 'Serial Number', tipoDato: 'text' },
    { nombreEtiqueta: 'Usuario Asignado', tipoDato: 'usuario_search' },
    { nombreEtiqueta: 'Estado', tipoDato: 'dropdown', opciones: ['Disponible', 'Asignado', 'Reparación', 'Baja'] }
  ];

  useEffect(() => { cargarTipos(); }, []);
  const cargarTipos = async () => { try { const res = await axios.get('http://localhost:5000/api/asset-types'); setTipos(res.data); } catch (e) { console.error(e); } };

  const startEdit = (t) => {
    let actual = t.campos || [];
    // Inyectar solo los que falten visualmente para poder editarlos
    const tiene = (label) => actual.some(c => c.nombreEtiqueta.toLowerCase().includes(label.toLowerCase()));
    if (!tiene('Serial')) actual = [...BASE_FIELDS.filter(bf => !tiene(bf.nombreEtiqueta)), ...actual];

    setEditingType({ ...t, campos: actual });
    setIsCreating(false); setNewFieldLabel('');
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return alert("Nombre requerido");
    let opts = [];
    if (newFieldType === 'dropdown') opts = dropdownOptions.split(',').map(o => o.trim());
    const nuevo = { nombreEtiqueta: newFieldLabel, tipoDato: newFieldType, opciones: opts };
    setEditingType({ ...editingType, campos: [...(editingType.campos || []), nuevo] });
    setNewFieldLabel(''); setDropdownOptions('');
  };

  const handleSaveType = async () => {
    try {
      if (isCreating) await axios.post('http://localhost:5000/api/asset-types', editingType);
      else await axios.put(`http://localhost:5000/api/asset-types/${editingType._id}`, editingType);
      setEditingType(null); setIsCreating(false); cargarTipos();
    } catch (e) { alert(e.message); }
  };

  const getTypeIcon = (type) => {
      if(type === 'text') return <Type size={14}/>;
      if(type === 'number') return <Hash size={14}/>;
      if(type === 'date') return <Calendar size={14}/>;
      if(type === 'dropdown') return <List size={14}/>;
      if(type === 'checkbox') return <CheckSquare size={14}/>;
      if(type === 'usuario_search') return <User size={14}/>;
      return <Tag size={14}/>;
  };

  return (
    <div className="p-8 pb-24 text-slate-200 h-screen flex flex-col">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-8"><SettingsIcon className="text-slate-400"/> Configuración</h1>
      <div className="flex flex-1 gap-8">
        <div className="w-64 bg-slate-800 rounded-xl border border-slate-700 h-fit overflow-hidden">
          <button onClick={() => setActiveTab('activos')} className={`w-full text-left p-4 flex items-center gap-3 transition-all ${activeTab === 'activos' ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}><Database size={18}/> Tipos de Activos</button>
        </div>
        <div className="flex-1">
          {activeTab === 'activos' && !editingType && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Modelos de Activos</h2><button onClick={() => { setEditingType({nombre:'', campos:BASE_FIELDS}); setIsCreating(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 font-bold transition-all active:scale-95"><Plus size={18}/> Crear Nuevo</button></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tipos.map(t => (
                  <div key={t._id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl hover:border-blue-500 group relative shadow-lg">
                    <div className="flex justify-between mb-3"><h3 className="font-bold text-lg">{t.nombre}</h3><button onClick={() => { if(window.confirm('¿Borrar tipo?')) axios.delete('http://localhost:5000/api/asset-types/'+t._id).then(cargarTipos) }} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16}/></button></div>
                    <div className="text-xs text-slate-500 mb-4">{t.campos.length} campos configurados</div>
                    <button onClick={() => startEdit(t)} className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors">Editar Campos</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activos' && editingType && (
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl animate-fade-in">
                <div className="flex justify-between mb-6 border-b border-slate-700 pb-4"><h2 className="text-2xl font-bold">{isCreating ? 'Nuevo Modelo' : `Editando: ${editingType.nombre}`}</h2><button onClick={() => setEditingType(null)} className="text-slate-400 hover:text-white transition-colors"><X size={24}/></button></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Nombre</label><input className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white mb-4 outline-none focus:border-blue-500" value={editingType.nombre} onChange={(e) => setEditingType({...editingType, nombre: e.target.value})} placeholder="Ej: Laptop"/></div>
                    <div className="md:col-span-2 bg-slate-900/50 p-6 rounded-xl border border-slate-700/50">
                        <h3 className="font-bold mb-4">Campos del Formulario (Arrastra para ordenar pronto)</h3>
                        <div className="grid grid-cols-12 gap-2 mb-6 bg-slate-800 p-3 rounded border border-slate-600">
                            <div className="col-span-4"><input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm outline-none" placeholder="Nombre" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)}/></div>
                            <div className="col-span-3"><select className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm outline-none" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}><option value="text">Texto</option><option value="number">Número</option><option value="date">Fecha</option><option value="dropdown">Dropdown</option><option value="checkbox">Checkbox</option><option value="usuario_search">Lupa Usuario</option></select></div>
                            <div className="col-span-4">{newFieldType === 'dropdown' ? (<input className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm outline-none" placeholder="Opciones..." value={dropdownOptions} onChange={(e) => setDropdownOptions(e.target.value)}/>) : <div className="text-xs text-slate-600 flex items-center h-full pl-2">Estándar</div>}</div>
                            <div className="col-span-1 flex justify-end"><button onClick={handleAddField} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded w-full flex justify-center items-center transition-all"><Plus size={18}/></button></div>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {editingType.campos?.map((campo, index) => (
                                <div key={index} className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700 hover:border-blue-500 transition-all group">
                                    <div className="flex items-center gap-3"><div className="p-2 bg-slate-900 rounded text-blue-400">{getTypeIcon(campo.tipoDato)}</div><div><p className="font-bold text-white text-sm">{campo.nombreEtiqueta}</p><p className="text-[10px] text-slate-500 uppercase">{campo.tipoDato}</p></div></div>
                                    <button onClick={() => setEditingType({...editingType, campos: editingType.campos.filter((_, i) => i !== index)})} className="text-slate-500 hover:text-red-400 p-2 transition-colors"><Trash2 size={16}/></button>
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
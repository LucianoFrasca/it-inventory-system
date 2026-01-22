import { useState, useEffect } from 'react';
import axios from 'axios';
import readXlsxFile from 'read-excel-file';
import { Users as UsersIcon, Upload, Trash2, Check, X, Download, Plus, Pencil, Save, CheckSquare, Square, Mail } from 'lucide-react';

const Users = () => {
  // --- ESTADOS DE DATOS ---
  const [usuarios, setUsuarios] = useState([]);
  
  // --- ESTADOS DE UI (Formulario y Selección) ---
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [seleccionados, setSeleccionados] = useState([]);
  const [ultimoSeleccionado, setUltimoSeleccionado] = useState(null);

  // --- ESTADOS DE IMPORTACIÓN ---
  const [modoImportar, setModoImportar] = useState(false);
  const [archivoData, setArchivoData] = useState([]);
  const [headersExcel, setHeadersExcel] = useState([]);
  const [mapeo, setMapeo] = useState({});
  const [procesando, setProcesando] = useState(false);

  // --- ESTADO DEL FORMULARIO ---
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '', apellido: '', email: '', rol: 'Estandar', cargo: '', area: '', departamento: ''
  });

  const CAMPOS_SISTEMA = [
    { key: 'nombre', label: 'Nombre' }, { key: 'apellido', label: 'Apellido' },
    { key: 'email', label: 'Correo Electrónico' }, { key: 'rol', label: 'Rol' },
    { key: 'area', label: 'Área' }, { key: 'departamento', label: 'Departamento' },
    { key: 'cargo', label: 'Cargo' }
  ];

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsuarios(res.data);
    } catch (error) { console.error(error); }
  };

  // --- 1. LÓGICA DE SELECCIÓN (Igual que Activos) ---
  const handleSelectOne = (id, index, e) => {
    let nuevos = [...seleccionados];
    if (e.shiftKey && ultimoSeleccionado !== null) {
      const start = Math.min(ultimoSeleccionado, index);
      const end = Math.max(ultimoSeleccionado, index);
      const idsRango = usuarios.slice(start, end + 1).map(u => u._id);
      const combinados = new Set([...nuevos, ...idsRango]);
      setSeleccionados(Array.from(combinados));
    } else {
      if (nuevos.includes(id)) novos = nuevos.filter(item => item !== id);
      else nuevos.push(id);
      setSeleccionados(nuevos);
      setUltimoSeleccionado(index);
    }
  };

  const handleSelectAll = () => {
    if (seleccionados.length === usuarios.length) setSeleccionados([]);
    else setSeleccionados(usuarios.map(u => u._id));
  };

  const eliminarMasivo = async () => {
    if (!window.confirm(`¿Eliminar ${seleccionados.length} usuarios?`)) return;
    try {
      await axios.post('http://localhost:5000/api/users/bulk-delete', { ids: seleccionados });
      alert('Usuarios eliminados');
      setSeleccionados([]);
      cargarUsuarios();
    } catch (e) { alert(e.message); }
  };

  // --- 2. LÓGICA DE FORMULARIO (Crear / Editar) ---
  const prepararEdicion = (usuario) => {
    setModoEdicion(true);
    setIdEdicion(usuario._id);
    setNuevoUsuario({
      nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email,
      rol: usuario.rol, cargo: usuario.cargo || '', area: usuario.area || '',
      departamento: usuario.departamento || ''
    });
    setMostrarFormulario(true);
  };

  const resetFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    setIdEdicion(null);
    setNuevoUsuario({ nombre: '', apellido: '', email: '', rol: 'Estandar', cargo: '', area: '', departamento: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        await axios.put(`http://localhost:5000/api/users/${idEdicion}`, nuevoUsuario);
        alert('Usuario actualizado');
      } else {
        const res = await axios.post('http://localhost:5000/api/users', nuevoUsuario);
        if (res.data.tempPassword) {
            alert(`Usuario creado.\n⚠️ El email falló. Contraseña temporal: ${res.data.tempPassword}`);
        } else {
            alert('Usuario creado y notificación enviada por email.');
        }
      }
      cargarUsuarios();
      resetFormulario();
    } catch (error) { alert('Error: ' + (error.response?.data?.message || error.message)); }
  };

  // --- 3. LÓGICA DE IMPORTACIÓN (Resumida) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const rows = await readXlsxFile(file);
      setHeadersExcel(rows[0]); setArchivoData(rows.slice(1)); setModoImportar(true);
    } catch (e) { alert("Error leyendo archivo"); }
  };
  
  const handleMapeoChange = (idx, val) => setMapeo({ ...mapeo, [idx]: val });

  const finalizarImportacion = async () => {
    const vals = Object.values(mapeo);
    if (!vals.includes('email') || !vals.includes('nombre')) return alert("Falta email o nombre");
    setProcesando(true);
    const data = archivoData.map(row => {
      let obj = {}; Object.keys(mapeo).forEach(k => obj[mapeo[k]] = row[k]); return obj;
    });
    try {
        const res = await axios.post('http://localhost:5000/api/users/bulk-import', data);
        alert(res.data.message);
        setModoImportar(false); cargarUsuarios();
    } catch(e) { alert(e.message); } finally { setProcesando(false); }
  };

  return (
    <div className="p-8 pb-24 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <UsersIcon className="text-blue-500"/> Gestión de Usuarios
        </h1>
        <div className="flex gap-3">
            {!modoImportar && !mostrarFormulario && (
                <>
                    <div className="relative">
                        <input type="file" accept=".xlsx" onChange={handleFileUpload} className="absolute inset-0 w-full opacity-0 cursor-pointer"/>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium">
                        <Upload size={20}/> Importar
                        </button>
                    </div>
                    <button onClick={() => setMostrarFormulario(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium">
                        <Plus size={20}/> Nuevo Usuario
                    </button>
                </>
            )}
        </div>
      </div>

      {/* --- FORMULARIO CREAR / EDITAR --- */}
      {mostrarFormulario && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-2xl mb-8 animate-fade-in-down">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                {modoEdicion ? <Pencil size={20}/> : <Plus size={20}/>} 
                {modoEdicion ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-slate-400 text-xs block mb-1">Nombre</label>
                    <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" required
                        value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} />
                </div>
                <div>
                    <label className="text-slate-400 text-xs block mb-1">Apellido</label>
                    <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" required
                        value={nuevoUsuario.apellido} onChange={e => setNuevoUsuario({...nuevoUsuario, apellido: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                    <label className="text-slate-400 text-xs block mb-1">Email {!modoEdicion && '(Se enviará contraseña temporal)'}</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-3 text-slate-500"/>
                        <input type="email" className={`w-full bg-slate-900 border border-slate-600 rounded p-2 pl-9 text-white ${modoEdicion ? 'opacity-50 cursor-not-allowed' : ''}`} required disabled={modoEdicion}
                            value={nuevoUsuario.email} onChange={e => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="text-slate-400 text-xs block mb-1">Rol</label>
                    <select className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={nuevoUsuario.rol} onChange={e => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}>
                        <option value="Estandar">Estandar</option>
                        <option value="Administrador">Administrador</option>
                    </select>
                </div>
                <div>
                    <label className="text-slate-400 text-xs block mb-1">Área</label>
                    <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={nuevoUsuario.area} onChange={e => setNuevoUsuario({...nuevoUsuario, area: e.target.value})} />
                </div>
                <div>
                    <label className="text-slate-400 text-xs block mb-1">Departamento</label>
                    <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={nuevoUsuario.departamento} onChange={e => setNuevoUsuario({...nuevoUsuario, departamento: e.target.value})} />
                </div>
                <div>
                    <label className="text-slate-400 text-xs block mb-1">Cargo</label>
                    <input className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                        value={nuevoUsuario.cargo} onChange={e => setNuevoUsuario({...nuevoUsuario, cargo: e.target.value})} />
                </div>

                <div className="md:col-span-2 flex gap-3 pt-4">
                    <button type="button" onClick={resetFormulario} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                    <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded flex justify-center gap-2">
                        <Save size={18}/> Guardar Usuario
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* --- IMPORTADOR (Se muestra si modoImportar es true) --- */}
      {modoImportar && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-8">
            <div className="flex justify-between mb-4">
                <h3 className="text-white font-bold">Mapeo de Importación</h3>
                <button onClick={() => setModoImportar(false)} className="text-slate-400"><X/></button>
            </div>
            {/* Tabla de Mapeo Resumida */}
            <div className="overflow-x-auto pb-4">
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            {headersExcel.map((h, i) => (
                                <th key={i} className="p-2 min-w-[120px]">
                                    <select className="w-full bg-slate-700 text-white text-sm p-1 rounded" onChange={(e)=>handleMapeoChange(i, e.target.value)}>
                                        <option value="">-- Ignorar --</option>
                                        {CAMPOS_SISTEMA.map(c => <option key={c.key} value={c.key} disabled={Object.values(mapeo).includes(c.key) && mapeo[i]!==c.key}>{c.label}</option>)}
                                    </select>
                                    <div className="text-xs text-slate-400 mt-1">{h}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {archivoData.slice(0,2).map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j} className="text-xs text-slate-500 p-2 border border-slate-700">{c}</td>)}</tr>)}
                    </tbody>
                </table>
            </div>
            <button onClick={finalizarImportacion} disabled={procesando} className="mt-4 bg-green-600 text-white px-4 py-2 rounded w-full font-bold">
                {procesando ? 'Procesando...' : 'Confirmar Importación'}
            </button>
        </div>
      )}

      {/* --- BARRA FLOTANTE MASIVA --- */}
      {seleccionados.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-bounce-in">
          <span className="font-bold">{seleccionados.length} seleccionados</span>
          <div className="h-4 w-px bg-blue-400"></div>
          <button onClick={eliminarMasivo} className="flex items-center gap-2 hover:text-red-200 transition-colors font-medium">
            <Trash2 size={18} /> Eliminar
          </button>
          <button onClick={() => setSeleccionados([])} className="ml-2 opacity-70 hover:opacity-100"><X size={18}/></button>
        </div>
      )}

      {/* --- TABLA PRINCIPAL --- */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4 w-10 text-center">
                 <button onClick={handleSelectAll}>
                    {seleccionados.length > 0 && seleccionados.length === usuarios.length ? <CheckSquare size={20} className="text-blue-500"/> : <Square size={20}/>}
                 </button>
              </th>
              <th className="p-4">Usuario</th>
              <th className="p-4">Área / Cargo</th>
              <th className="p-4">Rol</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {usuarios.map((u, index) => {
              const isSelected = seleccionados.includes(u._id);
              return (
                <tr key={u._id} className={`transition-colors ${isSelected ? 'bg-blue-900/20' : 'hover:bg-slate-700/50'}`}>
                  <td className="p-4 text-center">
                    <button onClick={(e) => handleSelectOne(u._id, index, e)} className="text-slate-400 hover:text-white">
                        {isSelected ? <CheckSquare size={20} className="text-blue-500"/> : <Square size={20}/>}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-white">{u.nombre} {u.apellido}</div>
                    <div className="text-sm text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-white text-sm">{u.area || u.departamento || '-'}</div>
                    <div className="text-xs text-slate-500">{u.cargo}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs border ${u.rol === 'Administrador' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => prepararEdicion(u)} className="p-2 text-blue-400 hover:bg-slate-600 rounded mr-2"><Pencil size={18}/></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
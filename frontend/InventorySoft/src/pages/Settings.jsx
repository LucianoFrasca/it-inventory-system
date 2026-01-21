import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Server } from 'lucide-react';

const Settings = () => {
  const [nombreTipo, setNombreTipo] = useState('');
  const [campos, setCampos] = useState([]);
  const [tiposExistentes, setTiposExistentes] = useState([]);

  // Cargar datos al iniciar
  useEffect(() => {
    const cargarTipos = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/asset-types');
        setTiposExistentes(res.data);
      } catch (error) {
        console.error("Error cargando tipos. ¿El backend está corriendo?", error);
      }
    };
    cargarTipos();
  }, []);

  const agregarCampo = () => {
    setCampos([...campos, { nombreEtiqueta: '', tipoDato: 'text', esRequerido: false }]);
  };

  const actualizarCampo = (index, key, value) => {
    const nuevosCampos = [...campos];
    nuevosCampos[index][key] = value;
    setCampos(nuevosCampos);
  };

  const guardarTipo = async (e) => {
    e.preventDefault();
    try {
      // Enviamos los datos al backend
      const res = await axios.post('http://localhost:5000/api/asset-types', {
        nombre: nombreTipo,
        campos: campos
      });
      alert('¡Modelo guardado correctamente!');
      setTiposExistentes([...tiposExistentes, res.data]); // Actualizamos la lista visual
      setNombreTipo('');
      setCampos([]);
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-3">
        <Server className="text-blue-500"/> Configuración de Activos
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FORMULARIO */}
        <div className="bg-slate-800 p-6 rounded-xl borderyb border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Crear Nuevo Modelo</h2>
          <form onSubmit={guardarTipo}>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">Nombre (Ej: Laptop)</label>
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={nombreTipo}
                onChange={(e) => setNombreTipo(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">Campos Personalizados</label>
              {campos.map((campo, index) => (
                <div key={index} className="flex gap-2 mb-2 bg-slate-900 p-2 rounded">
                  <input 
                    placeholder="Nombre del campo" 
                    className="bg-transparent text-white text-sm w-full outline-none"
                    value={campo.nombreEtiqueta}
                    onChange={(e) => actualizarCampo(index, 'nombreEtiqueta', e.target.value)}
                  />
                  <button type="button" onClick={() => {
                      const newCampos = campos.filter((_, i) => i !== index);
                      setCampos(newCampos);
                  }} className="text-red-400">
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
              <button type="button" onClick={agregarCampo} className="text-sm text-blue-400 flex items-center gap-1 mt-2">
                <Plus size={16}/> Agregar campo
              </button>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex justify-center gap-2">
              <Save size={18}/> Guardar Modelo
            </button>
          </form>
        </div>

        {/* LISTA DE MODELOS */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Modelos Existentes</h2>
          <div className="space-y-3">
            {tiposExistentes.map(tipo => (
              <div key={tipo._id} className="p-3 bg-slate-900 rounded border border-slate-700 text-white">
                <span className="font-bold">{tipo.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
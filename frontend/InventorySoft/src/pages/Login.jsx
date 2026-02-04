import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ URL CORREGIDA: Apuntando a /api/auth/login
      const res = await axios.post('https://itsoft-backend.onrender.com/api/auth/login', {
        email,
        password
      });

      // Guardar token y usuario
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Redirigir
      navigate('/');
      
    } catch (err) {
      console.error(err);
      // Mensaje de error más descriptivo
      if (err.response) {
          if(err.response.status === 404) setError("Servidor no encontrado (404). Revisa la URL.");
          else if(err.response.status === 401 || err.response.status === 400) setError("Credenciales incorrectas.");
          else setError(err.response.data.message || 'Error en el servidor.');
      } else {
          setError('Error de conexión. ¿El servidor en Render está despierto?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-500 tracking-wider">
            Inventory<span className="text-white">Soft</span>
          </h1>
          <p className="text-slate-400 mt-2">Acceso Administrativo</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded mb-4 text-sm flex items-center gap-2">
            <AlertCircle size={16}/> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-slate-300 text-sm mb-1 block">Correo Electrónico</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-slate-500"/>
              <input 
                type="email" 
                className="w-full bg-slate-900 border border-slate-600 rounded p-2.5 pl-10 text-white focus:border-blue-500 outline-none transition-colors"
                placeholder="admin@itsoft.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-sm mb-1 block">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-slate-500"/>
              <input 
                type="password" 
                className="w-full bg-slate-900 border border-slate-600 rounded p-2.5 pl-10 text-white focus:border-blue-500 outline-none transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all active:scale-95 flex justify-center">
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
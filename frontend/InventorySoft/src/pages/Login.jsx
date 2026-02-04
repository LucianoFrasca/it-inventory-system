import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://itsoft-backend.onrender.com', {
        email,
        password
      });

      // Guardamos el token en el navegador
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Redirigir al dashboard
      navigate('/');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al conectar');
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
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded mb-4 text-sm text-center">
            {error}
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
                placeholder="admin@empresa.com"
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

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-transform active:scale-95">
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
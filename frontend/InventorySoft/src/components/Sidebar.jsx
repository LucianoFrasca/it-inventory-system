import { useState, useEffect } from 'react'; // <--- AGREGADO useState y useEffect
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Box,
  AlertOctagon,
  History,
  Key // Icono de Licencias
} from 'lucide-react';
import UserAvatar from './UserAvatar'; 

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Activos IT', path: '/activos' },
    { icon: Key, label: 'Licencias', path: '/activos?tipo=Licencias' },
    { icon: Users, label: 'Usuarios', path: '/usuarios' },
    { icon: Box, label: 'Asignaciones', path: '/asignaciones' },
    { icon: AlertOctagon, label: 'Bajas', path: '/bajas' },
    { icon: History, label: 'Logs', path: '/logs' },
  ];

  // --- LÓGICA DE USUARIO REACTIVA ---
  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : {};
    } catch (e) { return {}; }
  };

  const [user, setUser] = useState(getUserFromStorage());

  // Escuchar cambios en el localStorage (cuando guardas en Configuración)
  useEffect(() => {
    const handleStorageChange = () => {
        setUser(getUserFromStorage());
    };

    // Escuchamos el evento personalizado que pusimos en Settings.jsx
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  // ----------------------------------

  const userRole = user.rol || 'Invitado';
  const userName = user.nombre ? `${user.nombre} ${user.apellido}` : 'Usuario';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path.includes('?')) return location.pathname + location.search === path;
    return location.pathname === path && !location.search.includes('tipo=Licencias');
  };

  return (
    <div className="h-screen w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 fixed left-0 top-0 z-50 transition-all">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
          <Package size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Inventory<span className="text-blue-500">Soft</span>
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map(item => {
          const active = isActive(item.path);
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 p-3 rounded-xl transition-all group relative overflow-hidden ${active ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
            >
              <item.icon size={20} className={`transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
              <span>{item.label}</span>
              {active && <div className="absolute right-0 top-0 h-full w-1 bg-blue-400 rounded-l-full"/>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link 
          to="/settings" 
          className="flex items-center gap-3 mb-4 p-2 -mx-2 rounded-xl hover:bg-slate-800 transition-all cursor-pointer group relative"
          title="Ir a Configuración de Perfil"
        >
          <UserAvatar 
            user={user} 
            size={42} 
            className="shadow-sm border-2 border-slate-700 group-hover:border-blue-500 transition-colors" 
          />
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-sm truncate group-hover:text-blue-400 transition-colors">{userName}</p>
            <p className="text-xs text-slate-500 capitalize truncate flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${userRole === 'Administrador' ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {userRole}
            </p>
          </div>
          <Settings size={18} className="text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all scale-90 group-hover:scale-100" />
        </Link>
        
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all group font-bold border border-transparent hover:border-red-500/20">
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
import { LayoutDashboard, Package, Users, Settings, LogOut } from 'lucide-react'; // <--- Importamos LogOut
import { Link, useLocation, useNavigate } from 'react-router-dom'; // <--- Importamos useNavigate

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate(); // <--- Hook para redirigir
  
  const menuItems = [
    { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', path: '/' },
    { icon: <Package size={20}/>, label: 'Activos', path: '/activos' },
    { icon: <Users size={20}/>, label: 'Usuarios', path: '/usuarios' },
    { icon: <Settings size={20}/>, label: 'Configuración', path: '/settings' },
  ];

  const handleLogout = () => {
    // 1. Borramos el token y el usuario del navegador
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 2. Redirigimos a la pantalla de Login
    navigate('/login');
  };

  return (
    <div className="h-screen w-64 bg-slate-900 border-r border-slate-700 flex flex-col p-4 fixed top-0 left-0">
      <div className="text-2xl font-bold mb-10 text-blue-500 tracking-wider">
        Inventory<span className="text-white">Soft</span>
      </div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.label} 
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* BOTÓN DE CERRAR SESIÓN */}
      <div className="pt-4 border-t border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 w-full transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
        <div className="text-xs text-slate-600 mt-4 text-center">
          v1.0.0 - IT Dept
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
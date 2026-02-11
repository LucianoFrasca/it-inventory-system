import React from 'react';

const UserAvatar = ({ user, size = 40, className = '' }) => {
  // Si no hay objeto usuario, mostramos un ?
  if (!user) {
    return (
      <div 
        className={`bg-slate-700 rounded-full flex items-center justify-center text-slate-400 font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        ?
      </div>
    );
  }

  // 1. Si tiene foto guardada, la mostramos
  if (user.avatar) {
    return (
      <img 
        src={user.avatar} 
        alt="Avatar" 
        className={`rounded-full object-cover border border-slate-600 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // 2. Si NO tiene foto, generamos iniciales y color
  const getInitials = () => {
    const n = user.nombre ? user.nombre[0] : '';
    const a = user.apellido ? user.apellido[0] : '';
    return (n + a).toUpperCase() || 'U';
  };

  // Colores para que no sean todos iguales
  const colors = [
    'bg-blue-600', 'bg-green-600', 'bg-purple-600', 
    'bg-orange-500', 'bg-pink-600', 'bg-teal-600'
  ];
  
  // Elegir color basado en el largo del nombre (para que siempre sea el mismo para esa persona)
  const nameLength = (user.nombre?.length || 0) + (user.apellido?.length || 0);
  const bgColor = colors[nameLength % colors.length];

  return (
    <div 
      className={`${bgColor} rounded-full flex items-center justify-center text-white font-bold shadow-sm border border-white/10 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={`${user.nombre} ${user.apellido}`}
    >
      {getInitials()}
    </div>
  );
};

// ESTA ES LA LÍNEA QUE TE FALTA:
export default UserAvatar;
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// --- IMPORTACIONES DE PÁGINAS ---
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Assets from './pages/Assets';
import Login from './pages/Login';
import Users from './pages/Users'; 
import UserAssignments from './pages/UserAssignments';
import WriteOffs from './pages/WritesOffs';
import Logs from './pages/Logs';
import QuickAdd from './pages/QuickAdd'; // <--- 1. IMPORTANTE: Agregar esta importación

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

// Layout principal (Con Sidebar)
const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 bg-slate-900">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* --- RUTA DE ESCANEO RÁPIDO (SIN SIDEBAR) --- */}
        {/* Esta ruta va "suelta" porque en el celular se ve mejor sin el menú lateral */}
        <Route path="/quick-add" element={
            <PrivateRoute>
                <QuickAdd /> {/* <--- 2. AQUÍ ESTÁ LA NUEVA RUTA */}
            </PrivateRoute>
        } />

        {/* --- RESTO DE RUTAS (CON SIDEBAR) --- */}
        <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
        <Route path="/activos" element={<PrivateRoute><Layout><Assets /></Layout></PrivateRoute>} />
        <Route path="/usuarios" element={<PrivateRoute><Layout><Users /></Layout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Layout><Settings /></Layout></PrivateRoute>} />
        <Route path="/bajas" element={<PrivateRoute><Layout><WriteOffs /></Layout></PrivateRoute>} />
        <Route path="/asignaciones" element={<PrivateRoute><Layout><UserAssignments /></Layout></PrivateRoute>} />
        <Route path="/logs" element={<PrivateRoute><Layout><Logs /></Layout></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
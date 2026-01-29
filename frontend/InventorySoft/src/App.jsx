import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// --- IMPORTACIONES DE PÁGINAS ---
import Dashboard from './pages/Dashboard'; // <--- 1. AGREGADO: El Dashboard de gráficos
import Settings from './pages/Settings';
import Assets from './pages/Assets';
import Login from './pages/Login';
import Users from './pages/Users'; 
import UserAssignments from './pages/UserAssignments';
import WriteOffs from './pages/WritesOffs'; // Asegúrate que el archivo se llame WriteOffs.jsx
import Logs from './pages/Logs'; // <--- AGREGAR ESTO

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

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

        {/* --- RUTA DEL DASHBOARD (INICIO) --- */}
        {/* Aquí mostramos el componente Dashboard con los gráficos */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <Dashboard /> {/* <--- 2. CAMBIO CLAVE: Usar el componente, no texto */}
            </Layout>
          </PrivateRoute>
        } />

        {/* ACTIVOS */}
        <Route path="/activos" element={
          <PrivateRoute>
            <Layout>
              <Assets />
            </Layout>
          </PrivateRoute>
        } />

        {/* USUARIOS */}
        <Route path="/usuarios" element={
            <PrivateRoute>
              <Layout>
                 <Users />
              </Layout>
            </PrivateRoute>
        } />

        {/* SETTINGS */}
        <Route path="/settings" element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        } />

        {/* --- NUEVA RUTA: BAJAS / HISTORIAL --- */}
        <Route path="/bajas" element={
          <PrivateRoute>
            <Layout>
              <WriteOffs />
            </Layout>
          </PrivateRoute>
        } />

        {/* ASIGNACIONES */}
        <Route path="/asignaciones" element={
          <PrivateRoute>
            <Layout>
              <UserAssignments />
            </Layout>
          </PrivateRoute>
        } />

        {/*RUTA LOGS*/}
          <Route path="/logs" element={
            <PrivateRoute>
             <Layout>
              <Logs />
             </Layout>
         </PrivateRoute>
        } />

        {/* CUALQUIER OTRA RUTA -> AL DASHBOARD */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
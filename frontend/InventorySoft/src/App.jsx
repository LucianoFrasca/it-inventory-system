import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Settings from './pages/Settings';
import Assets from './pages/Assets';
import Login from './pages/Login';
import Users from './pages/Users'; // <--- 1. IMPORTANTE: Importar la página nueva
import UserAssignments from './pages/UserAssignments';

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

        {/* DASHBOARD */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout>
              <h1 className="text-3xl font-bold">Bienvenido al Dashboard</h1>
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

        {/* USUARIOS - AHORA CONECTADO */}
        <Route path="/usuarios" element={
            <PrivateRoute>
              <Layout>
                 <Users />  {/* <--- 2. Aquí usamos el componente importado */}
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

        {/* CUALQUIER OTRA RUTA -> AL DASHBOARD */}
        <Route path="/asignaciones" element={<UserAssignments />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
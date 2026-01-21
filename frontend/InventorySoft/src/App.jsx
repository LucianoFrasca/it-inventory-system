import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Settings from './pages/Settings';
import Assets from './pages/Assets'; // <--- Importamos Assets

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-900 text-slate-200 font-sans">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 bg-slate-900">
          <Routes>
            <Route path="/" element={<h1 className="text-3xl font-bold">Bienvenido al Dashboard</h1>} />
            <Route path="/activos" element={<Assets />} />  {/* <--- Nueva ruta */}
            <Route path="/usuarios" element={<h1 className="text-3xl font-bold">Usuarios (Próximamente)</h1>} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
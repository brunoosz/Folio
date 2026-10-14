import { useState, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Splash } from './components/Splash/Splash';
import { BottomNav } from './components/ui/BottomNav';
import { Home } from './pages/Home';
import { Treino } from './pages/Treino';
import { Mapa } from './pages/Mapa';
import { Troca } from './pages/Troca';
import { Rotina } from './pages/Rotina';
import { Perfil } from './pages/Perfil';
import { Assistente } from './pages/Assistente';
import { Biblioteca } from './pages/Biblioteca';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { useAuthStore, initAuth } from './hooks/useAuthStore';

export default function App() {
  const [ready, setReady] = useState(false);
  const handleDone = useCallback(() => setReady(true), []);
  const logado = useAuthStore(s => s.logado);

  useEffect(() => { initAuth(); }, []);

  if (!logado) return <Login />;

  return (
    <HashRouter>
      {!ready && <Splash onDone={handleDone} />}
      <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 200ms ease' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/treino" element={<Treino />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/troca/:itemId" element={<Troca />} />
          <Route path="/rotina" element={<Rotina />} />
          <Route path="/assistente" element={<Assistente />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/perfil" element={<Perfil />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
}

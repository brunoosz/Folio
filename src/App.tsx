import { useState, useCallback, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Splash } from './components/Splash/Splash';
import { BottomNav } from './components/ui/BottomNav';
import { Toaster } from './components/ui/Toast';
import { Home } from './pages/Home';
import { Treino } from './pages/Treino';
import { Mapa } from './pages/Mapa';
import { Troca } from './pages/Troca';
import { Rotina } from './pages/Rotina';
import { Perfil } from './pages/Perfil';
import { Assistente } from './pages/Assistente';
import { Biblioteca } from './pages/Biblioteca';
import { Admin } from './pages/Admin';
import { Historico } from './pages/Historico';
import { Configuracoes } from './pages/Configuracoes';
import { Login } from './pages/Login';
import { useAuthStore, initAuth } from './hooks/useAuthStore';

// Restaura a sessão antes do primeiro render (evita piscar o login).
initAuth();

/** Rotas em que a barra inferior fica oculta (telas com ação própria no rodapé). */
const HIDE_NAV = [/^\/troca\//];

function Shell() {
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  const showNav = !HIDE_NAV.some(r => r.test(pathname));

  return (
    <>
      <main key={pathname} className="page-enter min-h-dvh">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/treino" element={<Treino />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/troca/:itemId" element={<Troca />} />
          <Route path="/rotina" element={<Rotina />} />
          <Route path="/assistente" element={<Assistente />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  const [revealed, setRevealed] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const handleReveal = useCallback(() => setRevealed(true), []);
  const handleDone = useCallback(() => { setRevealed(true); setSplashDone(true); }, []);
  const logado = useAuthStore(s => s.logado);

  return (
    <HashRouter>
      {revealed && (logado ? <Shell /> : <div key="login" className="page-enter"><Login /></div>)}
      {!splashDone && <Splash onReveal={handleReveal} onDone={handleDone} />}
      <Toaster />
    </HashRouter>
  );
}

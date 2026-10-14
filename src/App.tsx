import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Splash } from './components/Splash/Splash';
import { BottomNav } from './components/ui/BottomNav';
import { Toaster } from './components/ui/Toast';
import { Home } from './pages/Home';
import { Treino } from './pages/Treino';
import { Rotina } from './pages/Rotina';
import { Perfil } from './pages/Perfil';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { DescansoWatcher } from './components/Descanso';
import { usePerfilStore } from './hooks/usePerfilStore';
import { useAuthStore, initAuth } from './hooks/useAuthStore';

const Mapa = lazy(() => import('./pages/Mapa').then(m => ({ default: m.Mapa })));
const Troca = lazy(() => import('./pages/Troca').then(m => ({ default: m.Troca })));
const Assistente = lazy(() => import('./pages/Assistente').then(m => ({ default: m.Assistente })));
const Biblioteca = lazy(() => import('./pages/Biblioteca').then(m => ({ default: m.Biblioteca })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Historico = lazy(() => import('./pages/Historico').then(m => ({ default: m.Historico })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then(m => ({ default: m.Configuracoes })));
const ExercicioDetalhe = lazy(() => import('./pages/ExercicioDetalhe').then(m => ({ default: m.ExercicioDetalhe })));
const Nutricao = lazy(() => import('./pages/Nutricao').then(m => ({ default: m.Nutricao })));
const PerfilDados = lazy(() => import('./pages/PerfilDados').then(m => ({ default: m.PerfilDados })));
const Fichas = lazy(() => import('./pages/Fichas').then(m => ({ default: m.Fichas })));
const FichaEditor = lazy(() => import('./pages/Fichas').then(m => ({ default: m.FichaEditor })));

// Restaura a sessão antes do primeiro render (evita piscar o login).
initAuth();

/** Rotas em que a barra inferior fica oculta (telas com ação própria no rodapé). */
const HIDE_NAV = [/^\/troca\//];

function CarregandoPagina() {
  return (
    <div className="px-4 pt-8 max-w-lg mx-auto flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
      <div className="skeleton" style={{ height: 28, width: '55%' }} />
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 80 }} />
    </div>
  );
}

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
        <Suspense fallback={<CarregandoPagina />}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/treino" element={<Treino />} />
          <Route path="/treino/:itemId" element={<ExercicioDetalhe />} />
          <Route path="/exercicio/:exId" element={<ExercicioDetalhe />} />
          <Route path="/fichas" element={<Fichas />} />
          <Route path="/fichas/:fichaId" element={<FichaEditor />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/troca/:itemId" element={<Troca />} />
          <Route path="/rotina" element={<Rotina />} />
          <Route path="/nutricao" element={<Nutricao />} />
          <Route path="/assistente" element={<Assistente />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/perfil/dados" element={<PerfilDados />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      {showNav && <BottomNav />}
      <DescansoWatcher />
    </>
  );
}

export default function App() {
  const [revealed, setRevealed] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const handleReveal = useCallback(() => setRevealed(true), []);
  const handleDone = useCallback(() => { setRevealed(true); setSplashDone(true); }, []);
  const logado = useAuthStore(s => s.logado);
  const pesquisaFeita = usePerfilStore(s => s.pesquisaFeita);

  return (
    <HashRouter>
      {revealed && (
        !logado ? <div key="login" className="page-enter"><Login /></div>
        : !pesquisaFeita ? <div key="pesquisa" className="page-enter"><Onboarding /></div>
        : <Shell />
      )}
      {!splashDone && <Splash onReveal={handleReveal} onDone={handleDone} />}
      <Toaster />
    </HashRouter>
  );
}

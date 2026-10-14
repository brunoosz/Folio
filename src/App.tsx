import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Splash } from './components/Splash/Splash';
import { BottomNav } from './components/ui/BottomNav';
import { Home } from './pages/Home';
import { Treino } from './pages/Treino';
import { Mapa } from './pages/Mapa';
import { Troca } from './pages/Troca';

export default function App() {
  const [ready, setReady] = useState(false);
  const handleDone = useCallback(() => setReady(true), []);

  return (
    <BrowserRouter>
      {!ready && <Splash onDone={handleDone} />}
      <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 200ms ease' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/treino" element={<Treino />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/troca/:itemId" element={<Troca />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

import { Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Music from './pages/Music';
import Film from './pages/Film';
import Mixing from './pages/Mixing';
import GrainOverlay from './components/GrainOverlay';
import { AnimatePresence } from 'framer-motion';

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background text-primary selection:bg-[var(--hover-color)] selection:text-black overflow-hidden font-sans">
      <GrainOverlay />
      <Navigation />
      
      <main className="relative z-10 pt-20">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/music" element={<Music />} />
            <Route path="/film" element={<Film />} />
            <Route path="/mixing" element={<Mixing />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;

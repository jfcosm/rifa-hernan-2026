import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Countdown } from './components/Countdown';
import { PrizesSection } from './components/PrizesSection';
import { NumberGrid } from './components/NumberGrid';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ThemeToggle } from './components/ThemeToggle';
import { 
  getNumbers, getPrizes, getRaffleConfig, 
  isAdminLoggedIn
} from './services/dataService';
import type { RaffleNumber, Prize, RaffleConfig } from './services/dataService';

const PublicView = () => {
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [config, setConfig] = useState<RaffleConfig | null>(null);

  useEffect(() => {
    // Check local storage for data, or initialize
    setNumbers(getNumbers());
    setPrizes(getPrizes());
    setConfig(getRaffleConfig());

    // Refresh every minute to keep countdown and data updated
    const interval = setInterval(() => {
      setNumbers(getNumbers());
      setPrizes(getPrizes());
      setConfig(getRaffleConfig());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!config) return null;

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--text-primary)' }}>La Rifa de Hernán</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Admin</button>
        </div>
      </header>

      <Countdown targetDate={config.drawDate} />
      
      <div style={{ marginTop: '4rem' }}>
        <PrizesSection prizes={prizes} />
      </div>

      <div style={{ marginTop: '4rem' }}>
        <NumberGrid numbers={numbers} isAdmin={false} />
      </div>
      
      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>© {new Date().getFullYear()} La Rifa de Hernán. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicView />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

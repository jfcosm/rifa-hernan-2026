import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Countdown } from './components/Countdown';
import { PrizesSection } from './components/PrizesSection';
import { NumberGrid } from './components/NumberGrid';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ThemeToggle } from './components/ThemeToggle';
import { 
  subscribeToNumbers, subscribeToPrizes, subscribeToConfig, 
  isAdminLoggedIn, formatCLP
} from './services/dataService';
import type { RaffleNumber, Prize, RaffleConfig } from './services/dataService';

const PublicView = () => {
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubConfig = subscribeToConfig((c) => {
      setConfig(c);
      setLoading(false);
    });
    const unsubPrizes = subscribeToPrizes(setPrizes);
    const unsubNumbers = subscribeToNumbers(setNumbers);

    return () => {
      unsubConfig();
      unsubPrizes();
      unsubNumbers();
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--text-primary)', marginBottom: '2rem' }}>La Rifa de Hernán</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Conectando a la base de datos...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--text-primary)', marginBottom: '2rem' }}>La Rifa de Hernán</h1>
        <div className="glass-card" style={{ display: 'inline-block', padding: '3rem' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Actualmente no hay ninguna rifa en curso</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Vuelve más adelante para participar en nuestros próximos sorteos.</p>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--text-primary)' }}>La Rifa de Hernán</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Admin</button>
        </div>
      </header>

      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ 
          display: 'inline-block', 
          background: 'var(--card-bg)', 
          border: '2px solid var(--accent-orange)', 
          borderRadius: '50px', 
          padding: '0.5rem 2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginRight: '1rem' }}>Valor del Número:</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>{formatCLP(config.ticketPrice || 2000)}</span>
        </div>
      </div>

      {config.showCountdown ? (
        <Countdown targetDate={config.drawDate} />
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Fecha del Sorteo</h2>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', fontWeight: 'bold', margin: 0 }}>
            {config.drawDateMessage}
          </p>
        </div>
      )}
      
      <div style={{ marginTop: '4rem' }}>
        <PrizesSection prizes={prizes} />
      </div>

      {/* Stats Panel */}
      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '500px', margin: '3rem auto 0' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disponibles</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
            {numbers.filter(n => n.status === 'available').length}
          </p>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vendidos</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>
            {numbers.filter(n => n.status === 'sold').length}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <NumberGrid numbers={numbers} isAdmin={false} />
      </div>
      
      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', paddingBottom: '2rem' }}>
        <p>© {new Date().getFullYear()} La Rifa de Hernán. Todos los derechos reservados.</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
          Hecha con el amor y energía de{' '}
          <a href="https://www.melodialab.net" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>
            MelodIA Lab
          </a>
        </p>
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

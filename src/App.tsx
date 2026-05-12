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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  const HERNAN_PHONE = '56944335942';

  const handleNumberClick = (num: RaffleNumber) => {
    if (num.status !== 'available') return;
    setSelectedIds(prev =>
      prev.includes(num.id) ? prev.filter(id => id !== num.id) : [...prev, num.id]
    );
  };

  const handleOpenModal = () => {
    setBuyerName('');
    setBuyerPhone('');
    setShowModal(true);
  };

  const handleSendWhatsApp = () => {
    if (!buyerName.trim() || !buyerPhone.trim()) {
      alert('Por favor ingresa tu nombre y celular.');
      return;
    }
    const nums = [...selectedIds].sort((a, b) => a - b).map(id => id.toString().padStart(3, '0')).join(', ');
    const msg = `Hola Hernán, quiero comprar los números ${nums}. Mi nombre es ${buyerName.trim()} y mi celular es el ${buyerPhone.trim()}`;
    const url = `https://wa.me/${HERNAN_PHONE}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setShowModal(false);
  };

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

      {/* CTA Banner */}
      <div style={{ marginTop: '3rem' }}>
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(250,150,30,0.15))',
          border: '2px solid var(--accent-orange)',
          borderRadius: '20px',
          padding: '2rem 2.5rem',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(250,150,30,0.2)'
        }}>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>¿Quieres participar?</p>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
            Selecciona tus números y contáctanos
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>
            Haz clic en los números <strong style={{ color: 'var(--success)' }}>disponibles</strong> para seleccionarlos, luego presiona el botón.
          </p>

          {selectedIds.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Números seleccionados:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                {[...selectedIds].sort((a, b) => a - b).map(id => (
                  <span key={id} style={{
                    background: 'var(--accent-orange)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '0.3rem 0.75rem',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}>
                    {id.toString().padStart(3, '0')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #25d366, #128c7e)',
              border: 'none',
              fontSize: '1.1rem',
              padding: '0.85rem 2.5rem',
              borderRadius: '50px',
              boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
              opacity: selectedIds.length === 0 ? 0.5 : 1,
              cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              margin: '0 auto'
            }}
            disabled={selectedIds.length === 0}
            onClick={handleOpenModal}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.861L.055 23.454a.5.5 0 0 0 .49.606l5.764-1.511A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.952 9.952 0 0 1-5.073-1.384l-.361-.214-3.742.981.999-3.648-.235-.374A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            {selectedIds.length === 0 ? 'Selecciona un número primero' : `Comprar ${selectedIds.length} número${selectedIds.length > 1 ? 's' : ''} por WhatsApp`}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <NumberGrid numbers={numbers} onNumberClick={handleNumberClick} isAdmin={false} selectedIds={selectedIds} />
      </div>

      {/* WhatsApp Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📲</div>
              <h2 style={{ margin: 0 }}>Completa tus datos</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                Para finalizar tu reserva, te redirigiremos a WhatsApp con tu solicitud lista.
              </p>
            </div>

            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(250,150,30,0.1)', borderRadius: '12px', border: '1px solid var(--accent-orange)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Números seleccionados:</p>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 'bold', color: 'var(--accent-orange)' }}>
                {[...selectedIds].sort((a,b)=>a-b).map(id => id.toString().padStart(3,'0')).join(', ')}
              </p>
            </div>

            <div className="input-group">
              <label>Tu nombre completo</label>
              <input
                type="text"
                className="input"
                placeholder="Ej: Juan Pérez González"
                value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Tu número de celular</label>
              <input
                type="tel"
                className="input"
                placeholder="Ej: +56912345678"
                value={buyerPhone}
                onChange={e => setBuyerPhone(e.target.value)}
              />
            </div>

            <button
              className="btn"
              style={{
                marginTop: '1.5rem',
                width: '100%',
                background: 'linear-gradient(135deg, #25d366, #128c7e)',
                border: 'none',
                fontSize: '1rem',
                padding: '0.85rem',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={handleSendWhatsApp}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.861L.055 23.454a.5.5 0 0 0 .49.606l5.764-1.511A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.952 9.952 0 0 1-5.073-1.384l-.361-.214-3.742.981.999-3.648-.235-.374A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Enviar solicitud por WhatsApp
            </button>
          </div>
        </div>
      )}
      
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

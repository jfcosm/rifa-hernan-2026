import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Countdown } from './components/Countdown';
import { PrizesSection } from './components/PrizesSection';
import { NumberGrid } from './components/NumberGrid';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { LiveDraw } from './components/LiveDraw';
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
  const [showVideoModal, setShowVideoModal] = useState(false);

  const HERNAN_PHONE = '56944335942';

  const isFinished = !config || config.status === 'finished';
  const activeConfig = config || {
    totalNumbers: 150,
    ticketPrice: 2000,
    showCountdown: false,
    drawDate: '',
    drawDateMessage: 'Sorteo realizado el domingo 31 de mayo',
    status: 'finished' as const
  };

  const handleNumberClick = (num: RaffleNumber) => {
    if (isFinished) return;
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

  useEffect(() => {
    const closed = sessionStorage.getItem('results_popup_closed');
    if (!closed) {
      setShowVideoModal(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--text-primary)', marginBottom: '2rem' }}>La Rifa de Hernán</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Conectando a la base de datos...</p>
      </div>
    );
  }

  return (
    <>
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
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>{formatCLP(activeConfig.ticketPrice || 2000)}</span>
        </div>
      </div>

      {isFinished ? (
        <div className="glass-card animate-fade-in" style={{ 
          textAlign: 'center', 
          padding: '3rem 2rem',
          border: '2px solid var(--accent-orange)',
          background: 'linear-gradient(135deg, rgba(250, 150, 30, 0.15), rgba(99, 102, 241, 0.15))',
          boxShadow: '0 8px 32px rgba(250, 150, 30, 0.2)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>🎉 ¡Sorteo Realizado!</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            El sorteo se realizó hoy **domingo 31 de mayo**. Agradecemos de corazón a todos quienes participaron de la rifa y nos apoyaron con la compra de sus números. ¡Muchísimas gracias a todos por su gran colaboración!
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowVideoModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 2.2rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            <span>🎥</span> Ver Video del Sorteo
          </button>
        </div>
      ) : activeConfig.showCountdown ? (
        <Countdown targetDate={activeConfig.drawDate} />
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Fecha del Sorteo</h2>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', fontWeight: 'bold', margin: 0 }}>
            {activeConfig.drawDateMessage}
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
      {!isFinished && (
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
      )}

      <div style={{ marginTop: '3rem' }}>
        <NumberGrid numbers={numbers} onNumberClick={handleNumberClick} isAdmin={false} selectedIds={selectedIds} />
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

    {/* YouTube Video Results Modal */}
    {showVideoModal && (
      <div className="modal-overlay" style={{ zIndex: 2000, background: 'rgba(0, 0, 0, 0.85)' }}>
        <div className="modal-content animate-fade-in" style={{ 
          maxWidth: '440px', 
          padding: '2.5rem 1.5rem 1.5rem', 
          position: 'relative',
          background: 'var(--bg-gradient)',
          border: '2px solid var(--accent-orange)',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(249, 115, 22, 0.3)',
          textAlign: 'center',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflow: 'hidden'
        }}>
          <button 
            className="modal-close" 
            onClick={() => {
              setShowVideoModal(false);
              sessionStorage.setItem('results_popup_closed', 'true');
            }}
            style={{ top: '1rem', right: '1rem', fontSize: '1.2rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ✕
          </button>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🎉 ¡Resultados de la Rifa!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              Mira el video del sorteo realizado hoy domingo 31 de mayo
            </p>
          </div>

          <div style={{ 
            width: '100%', 
            maxWidth: '280px', 
            aspectRatio: '9/16', 
            margin: '0 auto', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            border: '1px solid var(--card-border)',
            background: '#000'
          }}>
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/2obmi1_inME" 
              title="Resultados Sorteo Rifa Hernán" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
              style={{ display: 'block' }}
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', borderRadius: '12px', padding: '0.8rem', fontWeight: 'bold' }}
            onClick={() => {
              setShowVideoModal(false);
              sessionStorage.setItem('results_popup_closed', 'true');
            }}
          >
            Cerrar Resultados
          </button>
        </div>
      </div>
    )}
  </>
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="app-container"><PublicView /></div>} />
        <Route path="/login" element={<div className="app-container"><AdminLogin /></div>} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <div className="app-container">
                <AdminPanel />
              </div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/draw" 
          element={
            <ProtectedRoute>
              <LiveDraw />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

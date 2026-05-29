import React from 'react';
import { formatCLP, obfuscatePhone } from '../services/dataService';
import type { Prize } from '../services/dataService';

interface PrizesSectionProps {
  prizes: Prize[];
}

export const PrizesSection: React.FC<PrizesSectionProps> = ({ prizes }) => {
  const activePrizes = prizes?.filter(p => p.isActive) || [];
  if (activePrizes.length === 0) return null;

  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <h2 className="text-center mb-8 text-gradient">Premios a Sortear</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {activePrizes.map((prize) => (
          <div key={prize.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {prize.image && (
              <img 
                src={prize.image} 
                alt={prize.title} 
                style={{ 
                  width: '100%', 
                  height: '200px', 
                  objectFit: 'cover', 
                  borderRadius: '12px' 
                }} 
              />
            )}
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{prize.title}</h3>
            <p style={{ color: 'var(--text-secondary)', flex: 1 }}>{prize.description}</p>
            {prize.winner ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(250, 150, 30, 0.15), rgba(99, 102, 241, 0.15))',
                border: '2px solid var(--accent-orange)',
                borderRadius: '12px',
                padding: '1rem',
                marginTop: 'auto',
                boxShadow: '0 4px 15px rgba(250, 150, 30, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>🏆</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-orange)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ¡Ganador!
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  Número {prize.winner.number.toString().padStart(3, '0')}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  {prize.winner.name} {prize.winner.lastName}
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                  Celular: {obfuscatePhone(prize.winner.phone)}
                </p>
              </div>
            ) : (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--success)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: 'bold',
                display: 'inline-block',
                alignSelf: 'flex-start',
                marginTop: 'auto'
              }}>
                Valor: {formatCLP(prize.value)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

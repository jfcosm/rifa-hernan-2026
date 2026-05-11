import React from 'react';
import { formatCLP } from '../services/dataService';
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
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: 'bold',
              display: 'inline-block',
              alignSelf: 'flex-start'
            }}>
              Valor: {formatCLP(prize.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

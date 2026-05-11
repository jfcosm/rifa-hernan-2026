import React from 'react';
import type { RaffleNumber } from '../services/dataService';

interface NumberGridProps {
  numbers: RaffleNumber[];
  onNumberClick?: (number: RaffleNumber) => void;
  isAdmin?: boolean;
}

export const NumberGrid: React.FC<NumberGridProps> = ({ numbers, onNumberClick, isAdmin }) => {
  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <h2 className="text-center mb-8 text-gradient">Números de la Rifa</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '1rem'
      }}>
        {numbers.map((num) => (
          <div 
            key={num.id} 
            onClick={() => onNumberClick && onNumberClick(num)}
            style={{
              background: num.status === 'available' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${num.status === 'available' ? 'var(--available)' : 'var(--sold)'}`,
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isAdmin ? 'pointer' : 'default',
              transition: 'transform 0.2s, box-shadow 0.2s',
              minHeight: '100px',
              boxShadow: num.status === 'available' 
                ? '0 4px 10px rgba(34, 197, 94, 0.1)' 
                : '0 4px 10px rgba(239, 68, 68, 0.1)'
            }}
            onMouseOver={(e) => {
              if (isAdmin) e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(e) => {
              if (isAdmin) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--number-text)' }}>
              {num.id.toString().padStart(3, '0')}
            </div>
            
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.85rem',
              textAlign: 'center',
              color: num.status === 'available' ? 'var(--available)' : 'var(--text-primary)'
            }}>
              {num.status === 'available' ? (
                'Disponible'
              ) : (
                num.buyer ? `${num.buyer.name} ${num.buyer.lastName.charAt(0)}.` : 'Vendido'
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

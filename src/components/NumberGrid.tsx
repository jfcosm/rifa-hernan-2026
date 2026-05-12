import React from 'react';
import type { RaffleNumber } from '../services/dataService';

interface NumberGridProps {
  numbers: RaffleNumber[];
  onNumberClick?: (number: RaffleNumber) => void;
  isAdmin?: boolean;
  selectedIds?: number[];
}

export const NumberGrid: React.FC<NumberGridProps> = ({ numbers, onNumberClick, isAdmin, selectedIds = [] }) => {
  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <h2 className="text-center mb-8 text-gradient">Números de la Rifa</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '1rem'
      }}>
        {numbers.map((num) => {
          const isSelected = selectedIds.includes(num.id);
          const isClickable = isAdmin || num.status === 'available';

          let bg = num.status === 'available' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
          let border = `1px solid ${num.status === 'available' ? 'var(--available)' : 'var(--sold)'}`;
          let boxShadow = num.status === 'available'
            ? '0 4px 10px rgba(34, 197, 94, 0.1)'
            : '0 4px 10px rgba(239, 68, 68, 0.1)';

          if (isSelected) {
            bg = 'rgba(250, 150, 30, 0.25)';
            border = '2px solid var(--accent-orange)';
            boxShadow = '0 0 16px rgba(250, 150, 30, 0.5)';
          }

          return (
            <div
              key={num.id}
              onClick={() => isClickable && onNumberClick && onNumberClick(num)}
              style={{
                background: bg,
                border,
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                minHeight: '100px',
                boxShadow,
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
              onMouseOver={(e) => {
                if (isClickable) e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                if (isClickable && !isSelected) e.currentTarget.style.transform = 'scale(1)';
                if (isSelected) e.currentTarget.style.transform = 'scale(1.05)';
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: isSelected ? 'var(--accent-orange)' : 'var(--number-text)' }}>
                {num.id.toString().padStart(3, '0')}
              </div>

              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                textAlign: 'center',
                color: isSelected ? 'var(--accent-orange)' : num.status === 'available' ? 'var(--available)' : 'var(--text-primary)'
              }}>
                {num.status === 'available' ? (
                  isSelected ? '✓ Seleccionado' : 'Disponible'
                ) : (
                  num.buyer ? `${num.buyer.name} ${num.buyer.lastName.charAt(0)}.` : 'Vendido'
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

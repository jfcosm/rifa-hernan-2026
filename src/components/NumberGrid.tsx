import React from 'react';
import type { RaffleNumber } from '../services/dataService';

interface NumberGridProps {
  numbers: RaffleNumber[];
  onNumberClick?: (number: RaffleNumber) => void;
  isAdmin?: boolean;
  selectedIds?: number[];
  // Bulk mode (admin only)
  bulkMode?: boolean;
  bulkSelectedIds?: number[];
  onBulkToggle?: (number: RaffleNumber) => void;
}

export const NumberGrid: React.FC<NumberGridProps> = ({
  numbers,
  onNumberClick,
  isAdmin,
  selectedIds = [],
  bulkMode = false,
  bulkSelectedIds = [],
  onBulkToggle,
}) => {
  return (
    <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
      <h2 className="text-center mb-8 text-gradient">Números de la Rifa</h2>

      {/* Legend for admin */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(34,197,94,0.3)', border: '1px solid var(--available)', display: 'inline-block' }} />
            Disponible
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.3)', border: '1px solid var(--sold)', display: 'inline-block' }} />
            Vendido · Pagado
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(251,191,36,0.3)', border: '1px solid #fbbf24', display: 'inline-block' }} />
            Vendido · Pendiente
          </span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '1rem'
      }}>
        {numbers.map((num) => {
          const isSelected = selectedIds.includes(num.id);
          const isBulkSelected = bulkSelectedIds.includes(num.id);
          const isClickable = isAdmin || num.status === 'available';
          const isPending = num.status === 'sold' && num.paymentStatus !== 'paid';

          let bg = 'rgba(34, 197, 94, 0.1)';
          let border = '1px solid var(--available)';
          let boxShadow = '0 4px 10px rgba(34, 197, 94, 0.1)';

          if (num.status === 'sold') {
            if (isPending) {
              bg = 'rgba(251, 191, 36, 0.12)';
              border = '1px solid #fbbf24';
              boxShadow = '0 4px 10px rgba(251,191,36,0.15)';
            } else {
              bg = 'rgba(239, 68, 68, 0.1)';
              border = '1px solid var(--sold)';
              boxShadow = '0 4px 10px rgba(239, 68, 68, 0.1)';
            }
          }

          if (isSelected) {
            bg = 'rgba(250, 150, 30, 0.25)';
            border = '2px solid var(--accent-orange)';
            boxShadow = '0 0 16px rgba(250, 150, 30, 0.5)';
          }

          if (isBulkSelected) {
            bg = 'rgba(99, 102, 241, 0.25)';
            border = '2px solid #6366f1';
            boxShadow = '0 0 16px rgba(99, 102, 241, 0.5)';
          }

          const handleClick = () => {
            if (bulkMode && onBulkToggle) {
              onBulkToggle(num);
            } else if (isClickable && onNumberClick) {
              onNumberClick(num);
            }
          };

          return (
            <div
              key={num.id}
              onClick={handleClick}
              style={{
                background: bg,
                border,
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isClickable || bulkMode) ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                minHeight: '100px',
                boxShadow,
                transform: (isSelected || isBulkSelected) ? 'scale(1.05)' : 'scale(1)',
                position: 'relative',
              }}
              onMouseOver={(e) => {
                if (isClickable || bulkMode) e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                if (!isSelected && !isBulkSelected) e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Bulk mode checkbox */}
              {bulkMode && (
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: isBulkSelected ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.4)',
                  background: isBulkSelected ? '#6366f1' : 'rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {isBulkSelected && '✓'}
                </div>
              )}

              {/* Payment status badge (admin only, sold numbers) */}
              {isAdmin && num.status === 'sold' && !bulkMode && (
                <div style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.04em',
                  background: isPending ? '#fbbf24' : '#22c55e',
                  color: isPending ? '#1a1a1a' : '#fff',
                }}>
                  {isPending ? 'PEND' : 'PAG'}
                </div>
              )}

              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: isBulkSelected
                  ? '#818cf8'
                  : isSelected
                    ? 'var(--accent-orange)'
                    : isPending
                      ? '#fbbf24'
                      : 'var(--number-text)'
              }}>
                {num.id.toString().padStart(3, '0')}
              </div>

              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                textAlign: 'center',
                color: isBulkSelected
                  ? '#818cf8'
                  : isSelected
                    ? 'var(--accent-orange)'
                    : num.status === 'available'
                      ? 'var(--available)'
                      : 'var(--text-primary)'
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

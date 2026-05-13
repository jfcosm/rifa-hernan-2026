import React, { useState } from 'react';
import type { RaffleNumber, RaffleConfig } from '../services/dataService';
import { formatCLP } from '../services/dataService';

interface BuyersListProps {
  numbers: RaffleNumber[];
  config: RaffleConfig;
}

interface BuyerSummary {
  name: string;
  lastName: string;
  phone: string;
  numbers: number[];
  paymentStatus: 'paid' | 'pending';
  total: number;
}

function groupBuyers(numbers: RaffleNumber[], price: number): { pending: BuyerSummary[]; paid: BuyerSummary[] } {
  const map = new Map<string, BuyerSummary>();

  numbers
    .filter(n => n.status === 'sold' && n.buyer)
    .forEach(n => {
      const b = n.buyer!;
      const isPaid = n.paymentStatus === 'paid';
      const key = `${b.name}||${b.lastName}||${b.phone}||${isPaid ? 'paid' : 'pending'}`;
      if (!map.has(key)) {
        map.set(key, {
          name: b.name,
          lastName: b.lastName,
          phone: b.phone,
          numbers: [],
          paymentStatus: isPaid ? 'paid' : 'pending',
          total: 0,
        });
      }
      const entry = map.get(key)!;
      entry.numbers.push(n.id);
      entry.total += price;
    });

  const all = Array.from(map.values()).sort((a, b) =>
    `${a.lastName} ${a.name}`.localeCompare(`${b.lastName} ${b.name}`)
  );

  return {
    pending: all.filter(b => b.paymentStatus === 'pending'),
    paid: all.filter(b => b.paymentStatus === 'paid'),
  };
}

const BuyerRow: React.FC<{ buyer: BuyerSummary }> = ({ buyer }) => {
  const isPending = buyer.paymentStatus === 'pending';
  const accentColor = isPending ? '#fbbf24' : '#22c55e';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: '0.75rem',
      padding: '0.9rem 1.1rem',
      borderRadius: '12px',
      background: isPending ? 'rgba(251,191,36,0.06)' : 'rgba(34,197,94,0.06)',
      border: `1px solid ${accentColor}30`,
      alignItems: 'center',
    }}>
      {/* Left: buyer info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {buyer.name} {buyer.lastName}
          </span>
          <a
            href={`https://wa.me/${buyer.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.78rem',
              background: '#25d36622',
              color: '#25d366',
              borderRadius: '6px',
              padding: '0.15rem 0.5rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontWeight: 600,
            }}
          >
            📱 {buyer.phone}
          </a>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {buyer.numbers.sort((a, b) => a - b).map(id => (
            <span key={id} style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              background: `${accentColor}25`,
              color: accentColor,
              borderRadius: '5px',
              padding: '0.1rem 0.45rem',
            }}>
              {id.toString().padStart(3, '0')}
            </span>
          ))}
        </div>
      </div>

      {/* Right: amount */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: accentColor }}>
          {formatCLP(buyer.total)}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          {buyer.numbers.length} n°
        </div>
      </div>
    </div>
  );
};

const CollapsibleSection: React.FC<{
  title: string;
  subtitle: string;
  accentColor: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, subtitle, accentColor, icon, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}40`,
          borderRadius: open ? '12px 12px 0 0' : '12px',
          padding: '0.9rem 1.1rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'border-radius 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: accentColor }}>{title}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{subtitle}</div>
          </div>
        </div>
        <span style={{ color: accentColor, fontSize: '1.1rem', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>▾</span>
      </button>

      {open && (
        <div style={{
          border: `1px solid ${accentColor}40`,
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          background: 'var(--card-bg)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

export const BuyersList: React.FC<BuyersListProps> = ({ numbers, config }) => {
  const price = config.ticketPrice || 0;
  const { pending, paid } = groupBuyers(numbers, price);

  const pendingTotal = pending.reduce((s, b) => s + b.total, 0);
  const paidTotal = paid.reduce((s, b) => s + b.total, 0);

  if (pending.length === 0 && paid.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎫</p>
        <p>Aún no hay números asignados a compradores.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>📋 Listado de Compradores</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Detalle por comprador · Haz clic en el celular para abrir WhatsApp
        </p>
      </div>

      {/* Pending buyers */}
      <CollapsibleSection
        title={`⏳ Pagos Pendientes (${pending.length} comprador${pending.length !== 1 ? 'es' : ''})`}
        subtitle={`Total por cobrar: ${formatCLP(pendingTotal)}`}
        accentColor="#fbbf24"
        icon="⚠️"
        defaultOpen={pending.length > 0}
      >
        {pending.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0', fontSize: '0.9rem' }}>
            ¡Sin pagos pendientes! 🎉
          </p>
        ) : (
          <>
            {pending.map((buyer, i) => (
              <BuyerRow key={i} buyer={buyer} />
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(251,191,36,0.2)',
              marginTop: '0.25rem',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total pendiente:</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fbbf24' }}>{formatCLP(pendingTotal)}</span>
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* Paid buyers */}
      <CollapsibleSection
        title={`✅ Pagos Confirmados (${paid.length} comprador${paid.length !== 1 ? 'es' : ''})`}
        subtitle={`Total recaudado: ${formatCLP(paidTotal)}`}
        accentColor="#22c55e"
        icon="💰"
        defaultOpen={false}
      >
        {paid.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0', fontSize: '0.9rem' }}>
            Aún no hay pagos confirmados.
          </p>
        ) : (
          <>
            {paid.map((buyer, i) => (
              <BuyerRow key={i} buyer={buyer} />
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(34,197,94,0.2)',
              marginTop: '0.25rem',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total recaudado:</span>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#22c55e' }}>{formatCLP(paidTotal)}</span>
            </div>
          </>
        )}
      </CollapsibleSection>
    </div>
  );
};

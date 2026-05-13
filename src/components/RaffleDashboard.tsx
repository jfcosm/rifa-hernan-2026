import React from 'react';
import type { RaffleNumber, RaffleConfig } from '../services/dataService';
import { formatCLP } from '../services/dataService';

interface RaffleDashboardProps {
  numbers: RaffleNumber[];
  config: RaffleConfig;
}

// SVG Donut chart
const DonutChart: React.FC<{
  segments: { value: number; color: string; label: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}> = ({ segments, size = 160, thickness = 28, centerLabel, centerSub }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const frac = total === 0 ? 0 : seg.value / total;
    const dashArray = `${frac * circumference} ${circumference}`;
    const rotation = (cumulative / (total || 1)) * 360 - 90;
    cumulative += seg.value;
    return { ...seg, dashArray, rotation, frac };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
      {arcs.map((arc, i) =>
        arc.value > 0 ? (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={thickness}
            strokeDasharray={arc.dashArray}
            strokeDashoffset={0}
            strokeLinecap="butt"
            transform={`rotate(${arc.rotation} ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ) : null
      )}
      {/* Center text */}
      {centerLabel && (
        <>
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={size * 0.14}
            fontWeight="bold"
            fontFamily="Outfit, sans-serif"
          >
            {centerLabel}
          </text>
          {centerSub && (
            <text
              x={cx}
              y={cy + size * 0.12}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.55)"
              fontSize={size * 0.08}
              fontFamily="Outfit, sans-serif"
            >
              {centerSub}
            </text>
          )}
        </>
      )}
    </svg>
  );
};

// Horizontal progress bar
const ProgressBar: React.FC<{
  value: number;
  max: number;
  color: string;
  label: string;
  sublabel?: string;
}> = ({ value, max, color, label, sublabel }) => {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 'bold', color }}>{value} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      {sublabel && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{sublabel}</div>}
      <div style={{ height: '8px', borderRadius: '99px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '99px',
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px ${color}88`
        }} />
      </div>
    </div>
  );
};

// Metric card
const MetricCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: string;
}> = ({ label, value, sub, color, icon }) => (
  <div style={{
    background: 'var(--card-bg)',
    border: `1px solid ${color}44`,
    borderRadius: '14px',
    padding: '1.1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    boxShadow: `0 4px 20px ${color}22`,
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `${color}15`, borderRadius: '0 14px 0 60px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0.5rem', fontSize: '1.3rem' }}>
      {icon}
    </div>
    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sub}</span>}
  </div>
);

export const RaffleDashboard: React.FC<RaffleDashboardProps> = ({ numbers, config }) => {
  const total = numbers.length;
  const sold = numbers.filter(n => n.status === 'sold').length;
  const available = total - sold;
  const paid = numbers.filter(n => n.status === 'sold' && n.paymentStatus !== 'pending').length;
  const pending = numbers.filter(n => n.status === 'sold' && n.paymentStatus === 'pending').length;

  const price = config.ticketPrice || 0;
  const revenueCollected = paid * price;
  const revenuePending = pending * price;
  const revenueTotal = sold * price;
  const revenueMax = total * price;

  const soldPct = total === 0 ? 0 : Math.round((sold / total) * 100);

  const donutSegments = [
    { value: paid, color: '#22c55e', label: 'Pagado' },
    { value: pending, color: '#fbbf24', label: 'Pendiente' },
    { value: available, color: 'rgba(255,255,255,0.12)', label: 'Disponible' },
  ];

  return (
    <div className="glass-card mb-8" style={{ border: '1px solid rgba(99,102,241,0.4)' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, background: 'linear-gradient(135deg, #818cf8, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📊 Dashboard de la Rifa
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Resumen en tiempo real · {total} números totales · {formatCLP(price)} c/u
        </p>
      </div>

      {/* Top metric cards */}
      <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '2rem' }}>
        <MetricCard label="Vendidos" value={String(sold)} sub={`${soldPct}% del total`} color="#6366f1" icon="🎟️" />
        <MetricCard label="Disponibles" value={String(available)} sub={`${100 - soldPct}% restante`} color="#22c55e" icon="✅" />
        <MetricCard label="Pagados" value={String(paid)} sub={sold > 0 ? `${Math.round((paid/sold)*100)}% de vendidos` : '—'} color="#10b981" icon="💰" />
        <MetricCard label="Pendientes" value={String(pending)} sub={sold > 0 ? `${Math.round((pending/sold)*100)}% de vendidos` : '—'} color="#fbbf24" icon="⏳" />
        <MetricCard label="Recaudado" value={formatCLP(revenueCollected)} sub="Pagos confirmados" color="#22c55e" icon="🏦" />
        <MetricCard label="Por cobrar" value={formatCLP(revenuePending)} sub="Pagos pendientes" color="#f97316" icon="📬" />
      </div>

      {/* Chart + progress section */}
      <div className="dashboard-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
        {/* Donut chart */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <DonutChart
            segments={donutSegments}
            size={180}
            thickness={32}
            centerLabel={`${soldPct}%`}
            centerSub="vendido"
          />
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
            {[
              { color: '#22c55e', label: 'Pagado', val: paid },
              { color: '#fbbf24', label: 'Pendiente de pago', val: pending },
              { color: 'rgba(255,255,255,0.25)', label: 'Disponible', val: available },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: item.color }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bars */}
        <div>
          <p style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Progreso de Ventas</p>
          <ProgressBar value={sold} max={total} color="#6366f1" label="Números vendidos" sublabel={`Meta: ${total} números`} />
          <ProgressBar value={paid} max={sold || 1} color="#22c55e" label="Pagos confirmados" sublabel={`De ${sold} vendidos`} />
          <ProgressBar value={pending} max={sold || 1} color="#fbbf24" label="Pagos pendientes" sublabel={`De ${sold} vendidos`} />

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Recaudación total estimada</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '1.4rem', color: '#818cf8' }}>{formatCLP(revenueTotal)}</p>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              de {formatCLP(revenueMax)} posibles ({total > 0 ? Math.round((revenueTotal/revenueMax)*100) : 0}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

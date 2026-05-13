import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  updateNumber, saveRaffleConfig,
  logoutAdmin, savePrizes,
  finishCurrentRaffle, getRaffleHistory,
  createNewRaffle, formatCLP,
  subscribeToNumbers, subscribeToPrizes, subscribeToConfig,
  bulkUpdateNumbers
} from '../services/dataService';
import type { RaffleNumber, RaffleConfig, Prize, RaffleHistoryItem } from '../services/dataService';
import { NumberGrid } from './NumberGrid';
import { ThemeToggle } from './ThemeToggle';
import { RaffleDashboard } from './RaffleDashboard';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [history, setHistory] = useState<RaffleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [editingNumber, setEditingNumber] = useState<RaffleNumber | null>(null);
  const [editForm, setEditForm] = useState({ name: '', lastName: '', phone: '', status: 'available', paymentStatus: 'pending' });

  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<number[]>([]);
  const [bulkForm, setBulkForm] = useState({ name: '', lastName: '', phone: '', status: 'sold', paymentStatus: 'pending' });
  const [bulkSaving, setBulkSaving] = useState(false);

  const loadData = () => {
    getRaffleHistory().then(setHistory);
  };

  useEffect(() => {
    loadData();

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

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const handleConfigSave = async () => {
    if (!config) return;
    await saveRaffleConfig(config);
    alert('Configuración guardada exitosamente');
  };

  const handleTogglePause = async () => {
    if (!config) return;
    const newStatus = config.status === 'paused' ? 'active' : 'paused';
    const newConfig: RaffleConfig = { ...config, status: newStatus };
    await saveRaffleConfig(newConfig);
  };

  const handleCreateNewRaffle = async () => {
    await createNewRaffle();
  };

  const handleFinishRaffle = async () => {
    if (confirm("¿Estás seguro de finalizar la rifa actual? Esto la archivará en el historial y limpiará el panel para configurar una nueva.")) {
      await finishCurrentRaffle();
      loadData();
    }
  };

  const handlePrizesSave = async () => {
    await savePrizes(prizes);
    alert('Premios guardados exitosamente');
  };

  const handlePrizeChange = (id: string, field: keyof Prize, value: string | number | boolean) => {
    setPrizes(prizes.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleNumberClick = (num: RaffleNumber) => {
    setEditingNumber(num);
    setEditForm({
      name: num.buyer?.name || '',
      lastName: num.buyer?.lastName || '',
      phone: num.buyer?.phone || '',
      status: num.status,
      paymentStatus: num.paymentStatus || 'pending'
    });
  };

  const handleBulkToggle = (num: RaffleNumber) => {
    setBulkSelectedIds(prev =>
      prev.includes(num.id) ? prev.filter(id => id !== num.id) : [...prev, num.id]
    );
  };

  const handleBulkSave = async () => {
    if (bulkSelectedIds.length === 0) return;
    setBulkSaving(true);
    const updatedNumbers: RaffleNumber[] = bulkSelectedIds.map(id => {
      if (bulkForm.status === 'sold') {
        return {
          id,
          status: 'sold' as const,
          paymentStatus: bulkForm.paymentStatus as 'paid' | 'pending',
          buyer: { name: bulkForm.name, lastName: bulkForm.lastName, phone: bulkForm.phone }
        };
      }
      return { id, status: 'available' as const };
    });
    await bulkUpdateNumbers(updatedNumbers);
    setBulkSelectedIds([]);
    setBulkMode(false);
    setBulkSaving(false);
  };

  const saveNumberEdit = async () => {
    if (!editingNumber) return;

    const updated: RaffleNumber = editForm.status === 'sold'
      ? {
          id: editingNumber.id,
          status: 'sold',
          paymentStatus: editForm.paymentStatus as 'paid' | 'pending',
          buyer: {
            name: editForm.name,
            lastName: editForm.lastName,
            phone: editForm.phone
          }
        }
      : {
          id: editingNumber.id,
          status: 'available'
        };

    await updateNumber(updated);
    setEditingNumber(null);
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Cargando Panel de Administración...</h2>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in">
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="text-gradient">Panel de Administración</h1>
          <div className="admin-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <ThemeToggle />
            <button className="btn btn-outline" onClick={() => navigate('/')}>Ver Rifa Pública</button>
            <button className="btn btn-danger" onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        </div>

        <div className="glass-card mb-8" style={{ border: '2px solid var(--accent-orange)' }}>
          <h2 className="mb-4">Estado de la Rifa Actual</h2>
          <div className="status-card-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: config ? (config.status === 'paused' ? 'var(--accent-orange)' : 'var(--success)') : 'var(--text-secondary)' }}>
                {config ? (config.status === 'paused' ? 'PAUSADA' : 'ACTIVA') : 'SIN RIFA ACTIVA'}
              </span>
              <p className="text-secondary" style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                {config ? 'La pausa es sólo visible para el admin y aplicable si la rifa tiene fecha definida.' : 'Crea una nueva rifa para comenzar.'}
              </p>
            </div>
            <div className="status-card-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn"
                style={{
                  backgroundColor: config ? 'var(--card-border)' : 'var(--accent-blue)',
                  color: config ? 'var(--text-secondary)' : 'white',
                  border: 'none',
                  cursor: config ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: config ? 0.6 : 1
                }}
                onClick={handleCreateNewRaffle}
                disabled={!!config}
              >
                + Crear Nueva Rifa
              </button>

              {config && config.showCountdown && (
                <button className="btn btn-outline" onClick={handleTogglePause}>
                  {config.status === 'paused' ? 'Reanudar Rifa' : 'Pausar Rifa'}
                </button>
              )}
              {config && (
                <button className="btn btn-danger" onClick={handleFinishRaffle}>Finalizar Rifa</button>
              )}
            </div>
          </div>
        </div>

        {config && (
          <RaffleDashboard numbers={numbers} config={config} />
        )}

        {config && (
          <>
            <div className="glass-card mb-8">
          <h2 className="mb-4">Configuración General</h2>
          <div className="config-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Total de Números</label>
              <input 
                type="number" 
                className="input" 
                value={config.totalNumbers}
                onChange={e => setConfig({...config, totalNumbers: parseInt(e.target.value) || 1})}
              />
            </div>
            <div className="input-group">
              <label>Valor del Número (CLP)</label>
              <input 
                type="number" 
                className="input" 
                value={config.ticketPrice}
                onChange={e => setConfig({...config, ticketPrice: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={config.showCountdown}
                  onChange={e => setConfig({...config, showCountdown: e.target.checked})}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: 'bold' }}>Mostrar Cuenta Regresiva</span>
              </label>
            </div>
            
            {config.showCountdown ? (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Fecha del Sorteo</label>
                <input 
                  type="datetime-local" 
                  className="input" 
                  value={config.drawDate ? new Date(config.drawDate).toISOString().slice(0, 16) : ''}
                  onChange={e => setConfig({...config, drawDate: new Date(e.target.value).toISOString()})}
                />
              </div>
            ) : (
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label>Mensaje Alternativo para la Fecha (cuando no hay cuenta regresiva)</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Ej: Cuando se vendan todos los números"
                  value={config.drawDateMessage}
                  onChange={e => setConfig({...config, drawDateMessage: e.target.value})}
                />
              </div>
            )}
          </div>
          <button className="btn btn-primary mt-4" onClick={handleConfigSave}>Guardar Configuración</button>
        </div>

        <div className="glass-card mb-8">
          <h2 className="mb-4">Gestión de Premios</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {prizes.map((prize) => (
              <div key={prize.id} style={{ border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{prize.title}</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={prize.isActive}
                      onChange={e => handlePrizeChange(prize.id, 'isActive', e.target.checked)}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span>Activo</span>
                  </label>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Título del Premio</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={prize.title}
                      onChange={e => handlePrizeChange(prize.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Valor (CLP)</label>
                    <input 
                      type="number" 
                      className="input" 
                      value={prize.value}
                      onChange={e => handlePrizeChange(prize.id, 'value', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>URL de la Imagen (enlace a internet)</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={prize.image}
                      onChange={e => handlePrizeChange(prize.id, 'image', e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <textarea 
                      className="input" 
                      value={prize.description}
                      onChange={e => handlePrizeChange(prize.id, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary mt-4" onClick={handlePrizesSave}>Guardar Premios</button>
        </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Gestión de Números</h2>
                  <p className="text-secondary" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                    {bulkMode ? `Modo masivo activo — ${bulkSelectedIds.length} número(s) seleccionado(s)` : 'Haz clic en un número para editar su estado.'}
                  </p>
                </div>
                <button
                  className="btn"
                  style={{
                    background: bulkMode ? '#6366f1' : 'var(--card-border)',
                    color: bulkMode ? 'white' : 'var(--text-primary)',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => { setBulkMode(m => !m); setBulkSelectedIds([]); }}
                >
                  {bulkMode ? '✕ Cancelar asignación masiva' : '☑ Asignación masiva'}
                </button>
              </div>

              <NumberGrid
                numbers={numbers}
                onNumberClick={handleNumberClick}
                isAdmin={true}
                bulkMode={bulkMode}
                bulkSelectedIds={bulkSelectedIds}
                onBulkToggle={handleBulkToggle}
              />

              {/* Bulk action floating panel */}
              {bulkMode && bulkSelectedIds.length > 0 && (
                <div className="bulk-panel" style={{
                  position: 'fixed',
                  bottom: '2rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--card-bg)',
                  border: '2px solid #6366f1',
                  borderRadius: '20px',
                  padding: '1.5rem 2rem',
                  boxShadow: '0 8px 40px rgba(99,102,241,0.4)',
                  zIndex: 1000,
                  minWidth: '360px',
                  maxWidth: '90vw'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: '#818cf8' }}>Asignar {bulkSelectedIds.length} número(s)</h3>
                    <div className="bulk-panel-tags" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[...bulkSelectedIds].sort((a,b)=>a-b).map(id => (
                        <span key={id} style={{ background: '#6366f1', color: 'white', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {id.toString().padStart(3,'0')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estado</label>
                      <select className="input" value={bulkForm.status} onChange={e => setBulkForm({...bulkForm, status: e.target.value})} style={{ marginTop: '0.25rem' }}>
                        <option value="sold">Vendido</option>
                        <option value="available">Disponible</option>
                      </select>
                    </div>
                    {bulkForm.status === 'sold' && (
                      <>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estado de Pago</label>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <button type="button" onClick={() => setBulkForm({...bulkForm, paymentStatus: 'paid'})} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '2px solid', borderColor: bulkForm.paymentStatus === 'paid' ? '#22c55e' : 'var(--card-border)', background: bulkForm.paymentStatus === 'paid' ? 'rgba(34,197,94,0.15)' : 'transparent', color: bulkForm.paymentStatus === 'paid' ? '#22c55e' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>✓ Pagado</button>
                            <button type="button" onClick={() => setBulkForm({...bulkForm, paymentStatus: 'pending'})} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '2px solid', borderColor: bulkForm.paymentStatus === 'pending' ? '#fbbf24' : 'var(--card-border)', background: bulkForm.paymentStatus === 'pending' ? 'rgba(251,191,36,0.15)' : 'transparent', color: bulkForm.paymentStatus === 'pending' ? '#fbbf24' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>⏳ Pendiente</button>
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre</label>
                          <input type="text" className="input" placeholder="Nombre" value={bulkForm.name} onChange={e => setBulkForm({...bulkForm, name: e.target.value})} style={{ marginTop: '0.25rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Apellido</label>
                          <input type="text" className="input" placeholder="Apellido" value={bulkForm.lastName} onChange={e => setBulkForm({...bulkForm, lastName: e.target.value})} style={{ marginTop: '0.25rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Celular</label>
                          <input type="text" className="input" placeholder="Celular" value={bulkForm.phone} onChange={e => setBulkForm({...bulkForm, phone: e.target.value})} style={{ marginTop: '0.25rem' }} />
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', background: '#6366f1', border: 'none', opacity: bulkSaving ? 0.7 : 1 }}
                    onClick={handleBulkSave}
                    disabled={bulkSaving}
                  >
                    {bulkSaving ? 'Guardando...' : `Guardar asignación de ${bulkSelectedIds.length} número(s)`}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="glass-card" style={{ marginTop: '2rem' }}>
          <h2 className="mb-4">Historial de Rifas</h2>
          {history.length === 0 ? (
            <p className="text-secondary">No hay rifas finalizadas aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {history.map(h => {
                const soldCount = h.numbers.filter(n => n.status === 'sold').length;
                const totalCollected = soldCount * (h.config.ticketPrice || 0);
                return (
                  <div key={h.id} style={{ border: '1px solid var(--card-border)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>Sorteo del {new Date(h.config.drawDate || h.config.finishedAt!).toLocaleDateString()}</h3>
                      <span className="text-secondary">Finalizada: {new Date(h.config.finishedAt!).toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '2rem' }}>
                      <p style={{ margin: 0 }}><strong>Números Vendidos:</strong> {soldCount} / {h.config.totalNumbers}</p>
                      <p style={{ margin: 0 }}><strong>Recaudación Estimada:</strong> {formatCLP(totalCollected)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editingNumber && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setEditingNumber(null)}>✕</button>
            <h2 className="mb-4">Editar Número {editingNumber.id.toString().padStart(3, '0')}</h2>
            
            <div className="input-group">
              <label>Estado</label>
              <select 
                className="input"
                value={editForm.status}
                onChange={e => setEditForm({...editForm, status: e.target.value})}
              >
                <option value="available">Disponible</option>
                <option value="sold">Vendido</option>
              </select>
            </div>

            {editForm.status === 'sold' && (
              <>
                {/* Payment status toggle */}
                <div className="input-group">
                  <label>Estado de Pago</label>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setEditForm({...editForm, paymentStatus: 'paid'})}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: editForm.paymentStatus === 'paid' ? '#22c55e' : 'var(--card-border)',
                        background: editForm.paymentStatus === 'paid' ? 'rgba(34,197,94,0.15)' : 'transparent',
                        color: editForm.paymentStatus === 'paid' ? '#22c55e' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ✓ Pagado
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({...editForm, paymentStatus: 'pending'})}
                      style={{
                        flex: 1,
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: editForm.paymentStatus === 'pending' ? '#fbbf24' : 'var(--card-border)',
                        background: editForm.paymentStatus === 'pending' ? 'rgba(251,191,36,0.15)' : 'transparent',
                        color: editForm.paymentStatus === 'pending' ? '#fbbf24' : 'var(--text-secondary)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ⏳ Pendiente
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label>Nombre</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Apellido</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={editForm.lastName}
                    onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label>Celular</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-primary" onClick={saveNumberEdit} style={{ flex: 1 }}>Guardar</button>
              <button className="btn btn-outline" onClick={() => setEditingNumber(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

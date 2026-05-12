import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getNumbers, updateNumber,
  getRaffleConfig, saveRaffleConfig,
  logoutAdmin,
  getPrizes, savePrizes,
  finishCurrentRaffle, getRaffleHistory,
  createNewRaffle,
  formatCLP
} from '../services/dataService';
import type { RaffleNumber, RaffleConfig, Prize, RaffleHistoryItem } from '../services/dataService';
import { NumberGrid } from './NumberGrid';
import { ThemeToggle } from './ThemeToggle';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [config, setConfig] = useState<RaffleConfig | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [history, setHistory] = useState<RaffleHistoryItem[]>([]);
  
  // Modal State
  const [editingNumber, setEditingNumber] = useState<RaffleNumber | null>(null);
  const [editForm, setEditForm] = useState({ name: '', lastName: '', phone: '', status: 'available' });

  useEffect(() => {
    setNumbers(getNumbers());
    setConfig(getRaffleConfig());
    setPrizes(getPrizes());
    setHistory(getRaffleHistory());
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/');
  };

  const handleConfigSave = () => {
    if (!config) return;
    saveRaffleConfig(config);
    setNumbers(getNumbers()); // refresh numbers in case total changed
    alert('Configuración guardada exitosamente');
  };

  const handleTogglePause = () => {
    if (!config) return;
    const newStatus = config.status === 'paused' ? 'active' : 'paused';
    const newConfig: RaffleConfig = { ...config, status: newStatus };
    setConfig(newConfig);
    saveRaffleConfig(newConfig);
  };

  const handleCreateNewRaffle = () => {
    createNewRaffle();
    window.location.reload();
  };

  const handleFinishRaffle = () => {
    if (confirm("¿Estás seguro de finalizar la rifa actual? Esto la archivará en el historial y limpiará el panel para configurar una nueva.")) {
      finishCurrentRaffle();
      window.location.reload();
    }
  };

  const handlePrizesSave = () => {
    savePrizes(prizes);
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
      status: num.status
    });
  };

  const saveNumberEdit = () => {
    if (!editingNumber) return;

    const updated: RaffleNumber = {
      ...editingNumber,
      status: editForm.status as 'available' | 'sold',
      buyer: editForm.status === 'sold' ? {
        name: editForm.name,
        lastName: editForm.lastName,
        phone: editForm.phone
      } : undefined
    };

    updateNumber(updated);
    setNumbers(getNumbers());
    setEditingNumber(null);
  };

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="text-gradient">Panel de Administración</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          <button className="btn btn-outline" onClick={() => navigate('/')}>Ver Rifa Pública</button>
          <button className="btn btn-danger" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
        </div>

        <div className="glass-card mb-8" style={{ border: '2px solid var(--accent-orange)' }}>
          <h2 className="mb-4">Estado de la Rifa Actual</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: config ? (config.status === 'paused' ? 'var(--accent-orange)' : 'var(--success)') : 'var(--text-secondary)' }}>
                {config ? (config.status === 'paused' ? 'PAUSADA' : 'ACTIVA') : 'SIN RIFA ACTIVA'}
              </span>
              <p className="text-secondary" style={{ margin: '0.5rem 0 0 0' }}>
                {config ? 'La pausa es sólo visible para el administrador y solo es aplicable si la rifa tiene fecha definida.' : 'Crea una nueva rifa para comenzar.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {config && config.showCountdown && (
                <button className="btn btn-outline" onClick={handleTogglePause}>
                  {config.status === 'paused' ? 'Reanudar Rifa' : 'Pausar Rifa'}
                </button>
              )}
              {config && (
                <button className="btn btn-danger" onClick={handleFinishRaffle}>Finalizar Rifa</button>
              )}
              {!config && (
                <button className="btn className-primary" style={{ backgroundColor: 'var(--accent-blue)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleCreateNewRaffle}>+ Crear Nueva Rifa</button>
              )}
            </div>
          </div>
        </div>

        {config && (
          <>
            <div className="glass-card mb-8">
          <h2 className="mb-4">Configuración General</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              <h2 className="mb-4">Gestión de Números</h2>
              <p className="mb-4 text-secondary">Haz clic en un número para editar su estado y el comprador.</p>
              <NumberGrid numbers={numbers} onNumberClick={handleNumberClick} isAdmin={true} />
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

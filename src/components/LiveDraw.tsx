import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  subscribeToNumbers, subscribeToPrizes, savePrizes, 
  formatCLP, obfuscatePhone 
} from '../services/dataService';
import type { RaffleNumber, Prize } from '../services/dataService';

type DrawItem = {
  id: string;
  type: 'water' | 'prize';
  label: string;
  prize?: Prize;
  winner?: {
    number: number;
    name: string;
    lastName: string;
    phone: string;
  };
  status: 'pending' | 'drawing' | 'drawn';
};

// Canvas Confetti Emitter
class ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;

  constructor(canvasWidth: number) {
    this.x = Math.random() * canvasWidth;
    this.y = -20 - Math.random() * 100;
    this.size = Math.random() * 8 + 6;
    const colors = ['#f59e0b', '#fb923c', '#3b82f6', '#10b981', '#ec4899', '#a855f7', '#ef4444'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.speedX = Math.random() * 4 - 2;
    this.speedY = Math.random() * 5 + 4;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 10 - 5;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.rotation += this.rotationSpeed;
  }
}

const WATER_EMOJIS = ['😅', '🤡', '🤷‍♂️', '🫣', '🤪', '🫠', '🤕', '🤦‍♂️', '🤭', '💸', '🎣', '💨', '🤷‍♀️', '🤦‍♀️'];

export const LiveDraw: React.FC = () => {
  const navigate = useNavigate();
  const [currentWaterEmoji, setCurrentWaterEmoji] = useState('😅');
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  // Setup/State
  const [step, setStep] = useState<'setup' | 'arena'>('setup');
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [waterCount, setWaterCount] = useState(3);
  const [drawList, setDrawList] = useState<DrawItem[]>([]);
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0);

  // Drawing State
  const [remainingSoldNumbers, setRemainingSoldNumbers] = useState<RaffleNumber[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<RaffleNumber | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Roulette Animation Refs & States
  const [spinStrip, setSpinStrip] = useState<RaffleNumber[]>([]);
  const [stripOffset, setStripOffset] = useState(0);
  const [pointerActive, setPointerActive] = useState(false);

  const stripRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTickIndex = useRef<number>(-1);

  // Confetti Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiParticles = useRef<ConfettiParticle[]>([]);
  const isConfettiActive = useRef(false);

  // Card dimensions for roulette
  const CARD_WIDTH = 160;
  const CARD_GAP = 12;
  const STEP = CARD_WIDTH + CARD_GAP;

  useEffect(() => {
    const unsubNumbers = subscribeToNumbers(setNumbers);
    const unsubPrizes = subscribeToPrizes((p) => {
      setPrizes(p);
      setLoading(false);
    });

    return () => {
      unsubNumbers();
      unsubPrizes();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const soldNumbers = numbers.filter(n => n.status === 'sold');

  // Confetti Loop
  const startConfetti = () => {
    isConfettiActive.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    confettiParticles.current = Array.from({ length: 150 }, () => new ConfettiParticle(canvas.width));

    const render = () => {
      if (!isConfettiActive.current || !canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confettiParticles.current.forEach((p, idx) => {
        p.update();
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        // Recycle particle
        if (p.y > canvas.height) {
          confettiParticles.current[idx] = new ConfettiParticle(canvas.width);
        }
      });

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();
  };

  const stopConfetti = () => {
    isConfettiActive.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Start the draw arena
  const handleStartDraw = () => {
    if (soldNumbers.length === 0) {
      alert('No hay números vendidos para realizar el sorteo.');
      return;
    }

    // Build the draw sequence
    const list: DrawItem[] = [];

    // 1. Add water numbers
    for (let i = 1; i <= waterCount; i++) {
      list.push({
        id: `water-${i}`,
        type: 'water',
        label: `Número al agua #${i}`,
        status: 'pending'
      });
    }

    // 2. Add active prizes sorted by value ascending (so grand prize is last)
    const activePrizes = [...prizes]
      .filter(p => p.isActive)
      .sort((a, b) => a.value - b.value);

    activePrizes.forEach((prize) => {
      list.push({
        id: `prize-${prize.id}`,
        type: 'prize',
        label: prize.title,
        prize: prize,
        winner: prize.winner,
        status: prize.winner ? 'drawn' : 'pending'
      });
    });

    setDrawList(list);

    // Filter available numbers for this session (excluding ones that already have a winner in DB)
    const alreadyWonNumbers = activePrizes
      .filter(p => p.winner)
      .map(p => p.winner!.number);

    const available = soldNumbers.filter(n => !alreadyWonNumbers.includes(n.id));
    setRemainingSoldNumbers(available);

    // Find the first pending item in the list
    const firstPendingIdx = list.findIndex(item => item.status === 'pending');
    setCurrentDrawIndex(firstPendingIdx >= 0 ? firstPendingIdx : 0);

    setStep('arena');
  };

  // Trigger roulette spin
  const handleSpin = () => {
    if (isSpinning || remainingSoldNumbers.length === 0) return;

    setIsSpinning(true);
    setCurrentWinner(null);
    setShowWinnerModal(false);
    stopConfetti();

    // Select winner randomly from remaining numbers
    const winnerIdx = Math.floor(Math.random() * remainingSoldNumbers.length);
    const winner = remainingSoldNumbers[winnerIdx];

    // Select random water emoji if this is a water draw
    const activeItem = drawList[currentDrawIndex];
    if (activeItem?.type === 'water') {
      const randomEmoji = WATER_EMOJIS[Math.floor(Math.random() * WATER_EMOJIS.length)];
      setCurrentWaterEmoji(randomEmoji);
    }

    // Build the strip
    // We want the winner to be at index 70 of the strip (so it spins a lot)
    const targetIdx = 70;
    const tempStrip: RaffleNumber[] = [];

    for (let i = 0; i < targetIdx + 15; i++) {
      if (i === targetIdx) {
        tempStrip.push(winner);
      } else {
        // Pick a random sold number for other indices
        const randomNum = soldNumbers[Math.floor(Math.random() * soldNumbers.length)];
        tempStrip.push(randomNum);
      }
    }
    setSpinStrip(tempStrip);

    // Reset offset
    setStripOffset(0);
    lastTickIndex.current = -1;

    // Animation settings
    const duration = 6500; // 6.5 seconds for dramatic deceleration
    const startTime = performance.now();
    const startOffset = 0;

    // Calculate final offset to center the target card
    const viewportWidth = viewportRef.current?.clientWidth || 600;
    const targetOffset = (targetIdx * STEP) + (CARD_WIDTH / 2) - (viewportWidth / 2);

    // Quartic ease-out (very fast start, very slow finish)
    const easeOutQuartic = (x: number): number => {
      return 1 - Math.pow(1 - x, 4);
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuartic(progress);

      const currentOffset = startOffset + (targetOffset - startOffset) * easedProgress;
      setStripOffset(currentOffset);

      // Tick Pointer Pulse logic:
      // Calculate which card is currently centered under the pointer
      const centerPos = currentOffset + (viewportWidth / 2);
      const cardIndex = Math.floor((centerPos - (CARD_GAP / 2)) / STEP);

      if (cardIndex !== lastTickIndex.current && cardIndex >= 0 && cardIndex < tempStrip.length) {
        lastTickIndex.current = cardIndex;
        // Trigger pointer bounce/flash
        setPointerActive(true);
        setTimeout(() => setPointerActive(false), 80);
      }

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Finish Spin
        setIsSpinning(false);
        setCurrentWinner(winner);
        setShowWinnerModal(true);
        startConfetti();
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);
  };

  // Save the winner of the current draw item
  const handleSaveWinner = async () => {
    if (!currentWinner) return;

    const currentItem = drawList[currentDrawIndex];

    // If it's a real prize, update database
    if (currentItem.type === 'prize' && currentItem.prize) {
      if (!isPracticeMode) {
        const winnerData = {
          number: currentWinner.id,
          name: currentWinner.buyer?.name || 'Sin nombre',
          lastName: currentWinner.buyer?.lastName || '',
          phone: currentWinner.buyer?.phone || ''
        };

        const updatedPrizes = prizes.map(p => {
          if (p.id === currentItem.prize!.id) {
            return { ...p, winner: winnerData };
          }
          return p;
        });

        await savePrizes(updatedPrizes);
      }
    }

    // Update local drawList state
    const updatedList = [...drawList];
    updatedList[currentDrawIndex] = {
      ...currentItem,
      winner: {
        number: currentWinner.id,
        name: currentWinner.buyer?.name || 'Sin nombre',
        lastName: currentWinner.buyer?.lastName || '',
        phone: currentWinner.buyer?.phone || ''
      },
      status: 'drawn'
    };
    setDrawList(updatedList);

    // Update session remaining numbers (exclude the winner so they don't win other prizes)
    setRemainingSoldNumbers(prev => prev.filter(n => n.id !== currentWinner.id));

    // Clear winner and modal
    setShowWinnerModal(false);
    setCurrentWinner(null);
    stopConfetti();

    // Advance to next pending item
    const nextIdx = currentDrawIndex + 1;
    if (nextIdx < drawList.length) {
      setCurrentDrawIndex(nextIdx);
    }
  };

  const handleSkipOrRedraw = () => {
    setShowWinnerModal(false);
    setCurrentWinner(null);
    stopConfetti();
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>Sorteo en Vivo</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando datos del sorteo...</p>
      </div>
    );
  }

  // Render Setup Screen
  if (step === 'setup') {
    const activePrizes = prizes.filter(p => p.isActive);

    return (
      <div className="animate-fade-in" style={{ maxWidth: '650px', margin: '2rem auto', padding: '1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.4rem' }}>🎬 Sorteo en Vivo</h1>
          <button className="btn btn-outline" onClick={() => navigate('/admin')}>Volver al Panel</button>
        </header>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(249, 115, 22, 0.4)' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Preparar la Transmisión</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Configura las condiciones del sorteo antes de abrir la pantalla principal en vivo.
            </p>
          </div>

          {/* Stats Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Números Vendidos</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--available)' }}>{soldNumbers.length}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Premios Activos</p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-orange)' }}>{activePrizes.length}</p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="input-group">
            <label style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Modo del Sorteo</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button 
                type="button" 
                onClick={() => setIsPracticeMode(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: !isPracticeMode ? 'var(--accent-orange)' : 'var(--card-border)',
                  background: !isPracticeMode ? 'rgba(249,115,22,0.15)' : 'var(--input-bg)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>🏆 Sorteo Oficial</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>Guarda ganadores en la Base de Datos</span>
              </button>
              <button 
                type="button" 
                onClick={() => setIsPracticeMode(true)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: isPracticeMode ? 'var(--accent-blue)' : 'var(--card-border)',
                  background: isPracticeMode ? 'rgba(59,130,246,0.15)' : 'var(--input-bg)',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>🧪 Modo Ensayo</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>Para probar animaciones (no guarda nada)</span>
              </button>
            </div>
          </div>

          {/* Water Numbers Count */}
          <div className="input-group">
            <label style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Cantidad de Números "Al Agua"
            </label>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 0.5rem 0' }}>
              Números que serán extraídos sin llevar premio antes del sorteo de premios reales (máximo de suspenso).
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}
                onClick={() => setWaterCount(Math.max(0, waterCount - 1))}
              >
                -
              </button>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '40px', textAlign: 'center' }}>{waterCount}</span>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.5rem 1rem', fontSize: '1.2rem' }}
                onClick={() => setWaterCount(waterCount + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Draw Order Summary */}
          <div>
            <label style={{ fontWeight: 'bold', color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
              Orden de Sorteo Proyectado
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', background: 'var(--input-bg)', border: '1px solid var(--card-border)', padding: '0.75rem', borderRadius: '8px' }}>
              {Array.from({ length: waterCount }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>😅</span>
                  <span>Sorteo #{i + 1}: Número al Agua (sin premio)</span>
                </div>
              ))}
              {activePrizes.sort((a,b) => a.value - b.value).map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'white', fontWeight: idx === activePrizes.length - 1 ? 'bold' : 'normal' }}>
                  <span>🎁</span>
                  <span>
                    Sorteo #{waterCount + idx + 1}: {p.title} ({formatCLP(p.value)}) {idx === activePrizes.length - 1 ? '🔥 ¡Gran Premio Final!' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button 
            className="btn btn-primary" 
            style={{ 
              marginTop: '1rem',
              padding: '1rem',
              fontSize: '1.2rem',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(249, 115, 22, 0.4)',
              background: 'linear-gradient(135deg, var(--accent-orange), #ef4444)'
            }}
            disabled={soldNumbers.length === 0}
            onClick={handleStartDraw}
          >
            🚀 Abrir Arena de Sorteo
          </button>
        </div>
      </div>
    );
  }

  // Render Arena Screen
  const activeItem = drawList[currentDrawIndex];
  const isFinishedAll = currentDrawIndex >= drawList.length || !activeItem;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'var(--bg-gradient)',
      color: 'var(--text-primary)',
      padding: '3rem 2rem',
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      {/* Canvas Confetti */}
      <canvas 
        ref={canvasRef} 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10
        }}
      />

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', zIndex: 5, position: 'relative' }}>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>🎬 Tómbola de Hernán</h2>
          {isPracticeMode && (
            <span style={{ background: '#3b82f6', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block', marginTop: '0.25rem' }}>
              🧪 MODO DE ENSAYO / PRUEBA
            </span>
          )}
        </div>
        <button 
          className="btn btn-outline" 
          onClick={() => {
            stopConfetti();
            setStep('setup');
          }}
          style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
        >
          ⚙️ Ajustes
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start', zIndex: 5, position: 'relative', flex: 1 }}>
        
        {/* Main Draw Console */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', minHeight: '560px', justifyContent: 'center', textAlign: 'center', flex: 1 }}>
          
          {isFinishedAll ? (
            <div className="animate-fade-in" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>¡Sorteo Concluido!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '450px', margin: '0 auto 2rem' }}>
                Todos los premios han sido sorteados y asignados con éxito. ¡Gracias por participar!
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ padding: '0.85rem 2.5rem', fontSize: '1.1rem', borderRadius: '30px' }}>
                Finalizar y Salir
              </button>
            </div>
          ) : (
            <>
              {/* Target Banner */}
              <div className="animate-fade-in" style={{ width: '100%' }}>
                <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.85rem', color: activeItem.type === 'water' ? 'var(--accent-orange)' : '#818cf8', fontWeight: 'bold' }}>
                  {activeItem.type === 'water' ? 'Sorteando Número al Agua' : 'Sorteando Premio Real'}
                </p>
                <h1 style={{ fontSize: '2.8rem', margin: '0.5rem 0', fontWeight: '800' }}>
                  {activeItem.label}
                </h1>
                {activeItem.prize && (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Descripción: {activeItem.prize.description} · Valor: <strong style={{ color: 'var(--success)' }}>{formatCLP(activeItem.prize.value)}</strong>
                  </p>
                )}
              </div>

              {/* Cinematic Roulette Container */}
              <div style={{ width: '100%', maxWidth: '650px', margin: '2rem 0', position: 'relative' }}>
                
                {/* Pointer / Needle */}
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: `translateX(-50%) scale(${pointerActive ? 1.3 : 1})`,
                  width: '32px',
                  height: '32px',
                  zIndex: 20,
                  transition: 'transform 0.08s ease',
                  filter: 'drop-shadow(0 4px 10px rgba(249, 115, 22, 0.5))'
                }}>
                  <svg viewBox="0 0 24 24" fill="var(--accent-orange)" width="100%" height="100%">
                    <path d="M12 21l-8-14h16z" />
                  </svg>
                </div>

                {/* Shading/Fade overlays */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: '120px',
                  background: 'linear-gradient(to right, var(--bg-color), transparent)',
                  zIndex: 10,
                  pointerEvents: 'none'
                }} />
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: '120px',
                  background: 'linear-gradient(to left, var(--bg-color), transparent)',
                  zIndex: 10,
                  pointerEvents: 'none'
                }} />

                {/* Viewport */}
                <div 
                  ref={viewportRef}
                  style={{
                    width: '100%',
                    height: '160px',
                    background: 'var(--input-bg)',
                    border: '2px solid var(--card-border)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.15)'
                  }}
                >
                  {/* Cards Flex Strip */}
                  <div 
                    ref={stripRef}
                    style={{
                      display: 'flex',
                      gap: `${CARD_GAP}px`,
                      paddingLeft: '0px',
                      transform: `translateX(-${stripOffset}px)`,
                      willChange: 'transform'
                    }}
                  >
                    {spinStrip.length === 0 ? (
                      // Dummy visual before first spin
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingLeft: '220px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                        Presiona el botón para cargar la tómbola
                      </div>
                    ) : (
                      spinStrip.map((num, idx) => (
                        <div 
                          key={`${num.id}-${idx}`}
                          style={{
                            width: `${CARD_WIDTH}px`,
                            height: '110px',
                            flexShrink: 0,
                            background: 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.75rem',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            backdropFilter: 'blur(12px)'
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', opacity: 0.8, letterSpacing: '0.05em' }}>Número</span>
                          <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                            {num.id.toString().padStart(3, '0')}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '0.25rem', fontWeight: 500 }}>
                            {num.buyer?.name || 'Comprador'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ zIndex: 12 }}>
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '1rem 3.5rem',
                    fontSize: '1.4rem',
                    borderRadius: '50px',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 30px rgba(249, 115, 22, 0.4)',
                    background: 'linear-gradient(135deg, var(--accent-orange), #ef4444)',
                    cursor: isSpinning ? 'not-allowed' : 'pointer'
                  }}
                  disabled={isSpinning}
                  onClick={handleSpin}
                >
                  {isSpinning ? 'Sorteando...' : '🔥 ¡SORTEAR!'}
                </button>

                {remainingSoldNumbers.length === 0 && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '1rem', fontWeight: 'bold' }}>
                    ¡Alerta! Todos los números vendidos han sido asignados. No quedan más números disponibles.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar / Live Status */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '560px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Orden del Sorteo</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Participan {remainingSoldNumbers.length} números restantes
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
            {drawList.map((item, idx) => {
              const isActive = idx === currentDrawIndex && !isFinishedAll;
              const isDrawn = item.status === 'drawn';
              
              return (
                <div 
                  key={item.id} 
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: isActive ? 'rgba(249, 115, 22, 0.12)' : 'var(--input-bg)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-orange)' : (isDrawn ? 'rgba(16, 185, 129, 0.4)' : 'var(--card-border)'),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: isActive ? 'var(--accent-orange)' : 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                    {isDrawn ? (
                      <span style={{ color: 'var(--success)', fontSize: '0.78rem', fontWeight: 'bold' }}>✓ LISTO</span>
                    ) : (
                      isActive ? (
                        <span style={{ color: 'var(--accent-orange)', fontSize: '0.78rem', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>AHORA</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', opacity: 0.6, fontSize: '0.78rem' }}>PENDIENTE</span>
                      )
                    )}
                  </div>
                  {item.winner && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Ganador: <strong>#{item.winner.number.toString().padStart(3, '0')}</strong> · {item.winner.name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Winner Reveal Modal */}
      {showWinnerModal && currentWinner && (
        <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="modal-content animate-fade-in" style={{
            background: 'var(--bg-gradient)',
            border: '3px solid var(--accent-orange)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            textAlign: 'center',
            maxWidth: '480px',
            color: 'var(--text-primary)',
            boxShadow: '0 10px 40px rgba(249, 115, 22, 0.4)'
          }}>
            <div style={{ fontSize: '4.5rem', animation: 'bounce 2s infinite', marginBottom: '1rem' }}>
              {activeItem?.type === 'water' ? currentWaterEmoji : '🏆'}
            </div>
            
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.85rem', color: 'var(--accent-orange)', fontWeight: 'bold' }}>
              {activeItem?.type === 'water' ? '¡Número al Agua Extraído!' : '¡Tenemos Ganador Oficial!'}
            </p>

            <h1 style={{ fontSize: '5rem', fontWeight: '900', margin: '0.5rem 0', color: 'var(--text-primary)', textShadow: '0 0 20px rgba(249,115,22,0.3)' }}>
              #{currentWinner.id.toString().padStart(3, '0')}
            </h1>

            <div style={{ margin: '1.5rem 0', padding: '1.25rem', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Comprador</p>
              <h2 style={{ margin: '0.2rem 0 0.5rem 0', fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                {currentWinner.buyer?.name} {currentWinner.buyer?.lastName}
              </h2>
              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Celular: {obfuscatePhone(currentWinner.buyer?.phone || '')}
              </p>
            </div>

            {activeItem?.type === 'water' ? (
              <p style={{ color: 'var(--text-secondary)', opacity: 0.8, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Este número no lleva premio. Continúa con el sorteo.
              </p>
            ) : (
              <p style={{ color: 'var(--text-secondary)', opacity: 0.9, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Premio asignado: <strong>{activeItem?.label}</strong>
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveWinner}
                style={{
                  padding: '1rem',
                  fontSize: '1.1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                {activeItem?.type === 'water' ? 'Continuar Sorteo' : (isPracticeMode ? 'Aceptar (Modo Ensayo)' : '✓ Asignar Premio y Continuar')}
              </button>
              
              <button 
                className="btn btn-outline" 
                onClick={handleSkipOrRedraw}
                style={{ borderRadius: '12px', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
              >
                🔄 Volver a Sortear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

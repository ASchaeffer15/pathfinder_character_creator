import React, { useState } from 'react';
import { X, Dices, RotateCcw, Sparkles } from 'lucide-react';

export default function DiceModal({ isOpen, onClose, onRollDice, lastRoll }) {
  const [modifier, setModifier] = useState(0);
  const [numDice, setNumDice] = useState(1);
  const [history, setHistory] = useState([]);

  if (!isOpen) return null;

  const diceTypes = [
    { sides: 20, name: 'd20' },
    { sides: 12, name: 'd12' },
    { sides: 10, name: 'd10' },
    { sides: 8, name: 'd8' },
    { sides: 6, name: 'd6' },
    { sides: 4, name: 'd4' },
    { sides: 100, name: 'd100' }
  ];

  const rollCustomDice = (sides) => {
    let rolls = [];
    let sum = 0;
    for (let i = 0; i < numDice; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      sum += r;
    }
    const total = sum + modifier;
    const isNat20 = sides === 20 && rolls.includes(20);
    const isNat1 = sides === 20 && rolls.includes(1);

    const rollRecord = {
      id: Date.now(),
      title: `${numDice}d${sides}${modifier >= 0 ? '+' : ''}${modifier}`,
      rolls,
      modifier,
      total,
      isNat20,
      isNat1,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setHistory(prev => [rollRecord, ...prev.slice(0, 15)]);
  };

  return (
    <div className="pb-modal-backdrop" onClick={onClose}>
      <div className="pb-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="pb-modal-header">
          <div className="pb-card-title">
            <Dices size={20} color="var(--gold-500)" />
            <span>Pathfinder 2e Dice Tray</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="pb-modal-body">
          {/* Controls: Num Dice & Modifier */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Quantity</label>
              <select value={numDice} onChange={(e) => setNumDice(parseInt(e.target.value))} style={{ width: '100%' }}>
                {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                  <option key={n} value={n}>{n} Dice</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Modifier</label>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Dice Selector Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
            {diceTypes.map((d) => (
              <button
                key={d.sides}
                className="pb-select-card"
                onClick={() => rollCustomDice(d.sides)}
                style={{ textAlign: 'center', padding: '0.75rem 0.5rem', alignItems: 'center', borderColor: d.sides === 20 ? 'var(--gold-500)' : '' }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: d.sides === 20 ? 'var(--text-gold)' : 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {d.name}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Roll</span>
              </button>
            ))}
          </div>

          {/* Latest Roll Spotlight */}
          {history.length > 0 && (
            <div style={{
              background: history[0].isNat20 ? 'rgba(245, 158, 11, 0.2)' : history[0].isNat1 ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-primary)',
              border: `1px solid ${history[0].isNat20 ? 'var(--gold-500)' : history[0].isNat1 ? 'var(--red-500)' : 'var(--border-subtle)'}`,
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{history[0].title}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: history[0].isNat20 ? 'var(--text-gold)' : history[0].isNat1 ? 'var(--red-500)' : 'var(--text-main)', lineHeight: 1.1 }}>
                {history[0].total}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Rolls: [{history[0].rolls.join(', ')}] {history[0].modifier !== 0 && `+ ${history[0].modifier}`}
                {history[0].isNat20 && <span style={{ color: 'var(--text-gold)', fontWeight: 700, marginLeft: 6 }}>CRITICAL SUCCESS!</span>}
                {history[0].isNat1 && <span style={{ color: 'var(--red-500)', fontWeight: 700, marginLeft: 6 }}>CRITICAL FAILURE!</span>}
              </div>
            </div>
          )}

          {/* Roll History */}
          {history.length > 1 && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Recent Rolls</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '140px', overflowY: 'auto' }}>
                {history.slice(1).map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0.6rem', background: 'var(--bg-primary)', borderRadius: '4px', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{h.title}</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: h.isNat20 ? 'var(--text-gold)' : 'var(--text-main)' }}>
                      Total: {h.total}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

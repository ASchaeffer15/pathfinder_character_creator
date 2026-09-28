import React from 'react';
import { 
  Shield, Heart, Eye, Activity, Sparkles, Dices, 
  RotateCcw, Download, Upload, Bot, Moon, Compass
} from 'lucide-react';

export default function Header({ 
  character, 
  onUpdateCharacter, 
  onRollDice, 
  onOpenDiceModal, 
  onToggleAiDrawer, 
  aiDrawerOpen,
  onExportJson,
  onImportJson,
  onOpenTour
}) {
  const handleHpChange = (amount) => {
    const newHp = Math.max(0, Math.min(character.maxHp, character.currentHp + amount));
    onUpdateCharacter({ currentHp: newHp });
  };

  const handleRest = () => {
    if (window.confirm("Rest 8 hours? This will restore Hit Points to full and reset temporary conditions.")) {
      onUpdateCharacter({ 
        currentHp: character.maxHp,
        tempHp: 0
      });
    }
  };

  return (
    <header className="pb-header">
      {/* Top Brand & Character Info */}
      <div className="pb-header-top">
        <div className="pb-brand-section">
          <div className="pb-logo-shield" title="Pathfinder 2e Character Builder">
            PF
          </div>
          <div className="pb-char-title-block">
            <input 
              type="text" 
              className="pb-char-name-input"
              value={character.name}
              onChange={(e) => onUpdateCharacter({ name: e.target.value })}
              title="Click to edit character name"
            />
            <div className="pb-char-subline">
              <span className="pb-pill-tag">Level {character.level}</span>
              <span className="pb-pill-tag">{character.ancestry} ({character.heritage})</span>
              <span className="pb-pill-tag">{character.class}</span>
              <span className="pb-pill-tag">{character.background}</span>
            </div>
          </div>
        </div>

        <div className="pb-header-actions">
          <button 
            className="pb-action-btn"
            onClick={onOpenDiceModal}
            title="Open Dice Roller"
          >
            <Dices size={16} />
            <span>Dice</span>
          </button>

          <button 
            className="pb-action-btn"
            onClick={handleRest}
            title="Rest 8 Hours"
          >
            <Moon size={16} />
            <span>Rest</span>
          </button>

          <button 
            className="pb-action-btn"
            onClick={onExportJson}
            title="Export Character to JSON"
          >
            <Download size={16} />
            <span>Export</span>
          </button>

          <label className="pb-action-btn" style={{ cursor: 'pointer' }} title="Import Character JSON">
            <Upload size={16} />
            <span>Import</span>
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={onImportJson} 
            />
          </label>

          <button 
            className="pb-action-btn"
            onClick={onOpenTour}
            title="Interactive App Tour (Shepherd)"
          >
            <Compass size={16} style={{ color: '#d97706' }} />
            <span>Tour</span>
          </button>

          <button 
            className={`pb-action-btn ai-trigger ${aiDrawerOpen ? 'active' : ''}`}
            onClick={onToggleAiDrawer}
            title="Toggle Pathfinder AI Companion"
          >
            <Bot size={16} />
            <span>Pathfinder AI</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Ribbon */}
      <div className="pb-stats-ribbon">
        {/* Armor Class */}
        <div className="pb-stat-badge ac" title={`AC Breakdown: 10 + Dex (${character.abilities.dexterity.modifier}) + Armor (${character.armorBonus}) + Shield (${character.shieldRaised ? 2 : 0})`}>
          <div className="pb-stat-icon" style={{ color: '#3b82f6' }}>
            <Shield size={20} />
          </div>
          <div>
            <div className="pb-stat-label">Armor Class</div>
            <div className="pb-stat-value">
              {character.ac + (character.shieldRaised ? 2 : 0)}
              {character.shieldRaised && <span style={{ fontSize: '0.7rem', color: '#10b981', marginLeft: 4 }}>+2 Shield</span>}
            </div>
          </div>
        </div>

        {/* Hit Points */}
        <div className="pb-stat-badge hp">
          <div className="pb-stat-icon" style={{ color: '#ef4444' }}>
            <Heart size={20} />
          </div>
          <div>
            <div className="pb-stat-label">Hit Points</div>
            <div className="pb-stat-value hp">
              {character.currentHp} / {character.maxHp}
              {character.tempHp > 0 && <span style={{ fontSize: '0.75rem', color: '#3b82f6', marginLeft: 4 }}>+{character.tempHp}</span>}
            </div>
          </div>
          <div className="hp-controls">
            <button className="hp-btn" onClick={() => handleHpChange(-5)} title="-5 HP">-5</button>
            <button className="hp-btn" onClick={() => handleHpChange(-1)} title="-1 HP">-1</button>
            <button className="hp-btn" onClick={() => handleHpChange(1)} title="+1 HP">+1</button>
            <button className="hp-btn" onClick={() => handleHpChange(5)} title="+5 HP">+5</button>
          </div>
        </div>

        {/* Perception */}
        <div 
          className="pb-stat-badge" 
          style={{ cursor: 'pointer' }}
          onClick={() => onRollDice('Perception Check', `1d20+${character.perception}`, character.perception)}
          title="Click to roll Perception check"
        >
          <div className="pb-stat-icon" style={{ color: '#8b5cf6' }}>
            <Eye size={20} />
          </div>
          <div>
            <div className="pb-stat-label">Perception ({character.perceptionProf})</div>
            <div className="pb-stat-value">+{character.perception}</div>
          </div>
        </div>

        {/* Fortitude Save */}
        <div 
          className="pb-stat-badge"
          style={{ cursor: 'pointer' }}
          onClick={() => onRollDice('Fortitude Save', `1d20+${character.saves.fortitude}`, character.saves.fortitude)}
          title="Click to roll Fortitude Save"
        >
          <div className="pb-stat-icon" style={{ color: '#10b981' }}>
            <Activity size={18} />
          </div>
          <div>
            <div className="pb-stat-label">Fortitude ({character.savesProf.fortitude})</div>
            <div className="pb-stat-value">+{character.saves.fortitude}</div>
          </div>
        </div>

        {/* Reflex Save */}
        <div 
          className="pb-stat-badge"
          style={{ cursor: 'pointer' }}
          onClick={() => onRollDice('Reflex Save', `1d20+${character.saves.reflex}`, character.saves.reflex)}
          title="Click to roll Reflex Save"
        >
          <div className="pb-stat-icon" style={{ color: '#06b6d4' }}>
            <Activity size={18} />
          </div>
          <div>
            <div className="pb-stat-label">Reflex ({character.savesProf.reflex})</div>
            <div className="pb-stat-value">+{character.saves.reflex}</div>
          </div>
        </div>

        {/* Will Save */}
        <div 
          className="pb-stat-badge"
          style={{ cursor: 'pointer' }}
          onClick={() => onRollDice('Will Save', `1d20+${character.saves.will}`, character.saves.will)}
          title="Click to roll Will Save"
        >
          <div className="pb-stat-icon" style={{ color: '#eab308' }}>
            <Activity size={18} />
          </div>
          <div>
            <div className="pb-stat-label">Will ({character.savesProf.will})</div>
            <div className="pb-stat-value">+{character.saves.will}</div>
          </div>
        </div>

        {/* Speed */}
        <div className="pb-stat-badge">
          <div>
            <div className="pb-stat-label">Speed</div>
            <div className="pb-stat-value">{character.speed} ft</div>
          </div>
        </div>

        {/* Hero Points */}
        <div className="pb-stat-badge gold">
          <div>
            <div className="pb-stat-label">Hero Points</div>
            <div className="pb-stat-value gold">{character.heroPoints} / 3</div>
          </div>
        </div>
      </div>
    </header>
  );
}

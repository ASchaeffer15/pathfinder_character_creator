import React, { useState, useMemo } from 'react';
import { Wand2, Plus, Sparkles, Flame, Shield, Search, Check, Zap, BookOpen, Star, HelpCircle } from 'lucide-react';
import { SPELLS_DB } from '../data/rulesData';
import srdData from '../data/srdRemasterData.json';

const SRD_SPELLS = srdData.spells || [];

export default function SpellsTab({ character, onUpdateCharacter, onRollDice }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('All');
  const [selectedTradition, setSelectedTradition] = useState('All');

  // Spellcasting calculation
  const sc = character.spellcasting;
  const tradition = sc?.tradition || (
    ['Cleric', 'Oracle'].includes(character.class) ? 'Divine' :
    character.class === 'Druid' ? 'Primal' :
    character.class === 'Bard' ? 'Occult' : 'Arcane'
  );

  const keyAttrKey = sc?.keyAttribute || (
    ['Cleric', 'Druid'].includes(character.class) ? 'wisdom' :
    ['Bard', 'Sorcerer', 'Oracle'].includes(character.class) ? 'charisma' : 'intelligence'
  );

  const attrMod = character.abilities?.[keyAttrKey]?.modifier ?? character.abilities?.intelligence?.modifier ?? 0;
  const profRank = sc?.proficiency || (character.level >= 19 ? 'Legendary' : character.level >= 15 ? 'Master' : character.level >= 7 ? 'Expert' : 'Trained');
  const profBonus = profRank === 'Legendary' ? 8 : profRank === 'Master' ? 6 : profRank === 'Expert' ? 4 : 2;
  const itemBonus = character.level >= 17 ? 1 : 0;
  
  const spellAttack = sc?.spellAttack ?? (character.level + profBonus + attrMod + itemBonus);
  const spellDC = sc?.spellDC ?? (10 + spellAttack);
  const maxRank = sc?.maxRank ?? Math.min(10, Math.ceil(character.level / 2));
  const focusPoints = sc?.focusPoints ?? 1;

  // Combine SRD Spells with fallback rulesData spells
  const allAvailableSpells = useMemo(() => {
    const list = SRD_SPELLS.length > 0 ? SRD_SPELLS : SPELLS_DB;
    return list;
  }, []);

  // Filtered spells
  const filteredSpells = useMemo(() => {
    return allAvailableSpells.filter(s => {
      const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || descMatch;

      const matchesRank = selectedRank === 'All' || s.rank === parseInt(selectedRank);
      
      const sTraditions = Array.isArray(s.tradition) ? s.tradition : [s.tradition];
      const matchesTrad = selectedTradition === 'All' || sTraditions.some(t => t.toLowerCase() === selectedTradition.toLowerCase());

      return matchesSearch && matchesRank && matchesTrad;
    });
  }, [allAvailableSpells, searchTerm, selectedRank, selectedTradition]);

  // Recommended spells for this character's tradition and level
  const recommendedSpells = useMemo(() => {
    return allAvailableSpells.filter(s => {
      const sTraditions = Array.isArray(s.tradition) ? s.tradition : [s.tradition];
      const matchesTrad = sTraditions.some(t => t.toLowerCase() === tradition.toLowerCase());
      const withinRank = s.rank <= maxRank;
      return matchesTrad && withinRank;
    }).slice(0, 12);
  }, [allAvailableSpells, tradition, maxRank]);

  const isSpellPrepared = (spell) => {
    return character.spells?.some(s => s.name.toLowerCase() === spell.name.toLowerCase());
  };

  const handleToggleSpell = (spell) => {
    if (isSpellPrepared(spell)) {
      onUpdateCharacter({
        spells: (character.spells || []).filter(s => s.name.toLowerCase() !== spell.name.toLowerCase())
      });
    } else {
      onUpdateCharacter({
        spells: [...(character.spells || []), spell]
      });
    }
  };

  const handlePrepareAllRecommended = () => {
    const current = [...(character.spells || [])];
    recommendedSpells.forEach(rec => {
      if (!current.some(s => s.name.toLowerCase() === rec.name.toLowerCase())) {
        current.push(rec);
      }
    });
    onUpdateCharacter({ spells: current });
  };

  const ranksList = ['All', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].filter(r => {
    if (r === 'All') return true;
    return parseInt(r) <= maxRank;
  });

  return (
    <div className="pb-spells-container">
      {/* Spellcasting Header Stats */}
      <div className="pb-card" style={{ marginBottom: '1.25rem' }}>
        <div className="pb-card-header">
          <span className="pb-card-title">
            <Wand2 size={18} />
            <span>Spellcasting Mastery &bull; {tradition} Tradition</span>
          </span>
          <span className="pb-pill-tag" style={{ color: 'var(--text-gold)', fontWeight: 700 }}>
            {profRank} ({tradition} &bull; {keyAttrKey.toUpperCase()})
          </span>
        </div>
        <div className="pb-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Spell Attack Roll</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-gold)', fontFamily: 'var(--font-mono)' }}>
              +{spellAttack}
            </div>
            <button 
              className="pb-roll-btn" 
              style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}
              onClick={() => onRollDice(`${tradition} Spell Attack`, `1d20+${spellAttack}`, spellAttack)}
            >
              Roll Attack (+{spellAttack})
            </button>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Spell Difficulty Class</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-gold)', fontFamily: 'var(--font-mono)' }}>
              {spellDC}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
              10 + Lvl({character.level}) + Prof({profBonus}) + {keyAttrKey.slice(0,3).toUpperCase()}({attrMod >= 0 ? `+${attrMod}` : attrMod})
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Focus Pool</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
              {focusPoints} / {focusPoints}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Refocus in 10 minutes</div>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Highest Spell Rank</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              Rank {maxRank}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Cantrips auto-heightened</div>
          </div>
        </div>

        {/* Spell Slots Breakdown */}
        {sc?.slots && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', borderRadius: '6px', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>SPELL SLOTS:</span>
            {Object.entries(sc.slots).map(([rkKey, count]) => {
              const rkNum = rkKey.replace('rank_', '');
              return (
                <span key={rkKey} className="pb-pill-tag" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'var(--border-gold)', color: 'var(--text-gold)', fontSize: '0.7rem' }}>
                  Rank {rkNum}: <strong>{count} slots</strong>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended Spells Section */}
      <div className="pb-card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--gold-500)' }}>
        <div className="pb-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="pb-card-title">
            <Star size={18} style={{ color: 'var(--text-gold)' }} />
            <span>Recommended Spells for Level {character.level} {character.class} ({tradition})</span>
          </span>
          <button 
            className="pb-action-btn"
            onClick={handlePrepareAllRecommended}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', background: 'rgba(245, 158, 11, 0.2)', borderColor: 'var(--gold-500)', color: 'var(--text-gold)' }}
          >
            <Check size={14} />
            <span>Prepare All Recommended</span>
          </button>
        </div>
        <div className="pb-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.65rem' }}>
            {recommendedSpells.map((rec) => {
              const prep = isSpellPrepared(rec);
              return (
                <div 
                  key={rec.id} 
                  style={{ 
                    background: prep ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-primary)', 
                    border: prep ? '1px solid var(--gold-500)' : '1px solid var(--border-subtle)', 
                    padding: '0.65rem', 
                    borderRadius: '6px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between' 
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>{rec.name}</span>
                      <span className="pb-pill-tag" style={{ fontSize: '0.65rem' }}>
                        {rec.rank === 0 ? 'Cantrip' : `Rank ${rec.rank}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-gold)', marginTop: 2 }}>
                      {rec.actions} &bull; {rec.saving_throw ? `Save: ${rec.saving_throw}` : (rec.range || 'Self')}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.3 }}>
                      {rec.description?.slice(0, 95)}...
                    </div>
                  </div>
                  <button
                    className={`pb-action-btn ${prep ? 'active' : ''}`}
                    onClick={() => handleToggleSpell(rec)}
                    style={{ marginTop: 6, width: '100%', justifyContent: 'center', fontSize: '0.72rem', padding: '0.2rem' }}
                  >
                    {prep ? '✓ Prepared' : '+ Prepare'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pb-grid-2">
        {/* Prepared Spells List */}
        <div className="pb-card">
          <div className="pb-card-header">
            <span className="pb-card-title">
              <Sparkles size={18} />
              <span>Prepared &amp; Known Spells ({character.spells?.length || 0})</span>
            </span>
          </div>
          <div className="pb-card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {(!character.spells || character.spells.length === 0) ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 1rem' }}>
                <BookOpen size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <p>No spells prepared yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: 4 }}>Select spells from the Recommended list above or browse the grimoire on the right.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {character.spells.map((s, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, marginRight: '0.5rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{s.name}</span>
                        <span className="pb-pill-tag" style={{ fontSize: '0.65rem' }}>
                          {s.rank === 0 ? 'Cantrip' : `Rank ${s.rank}`}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Actions: {s.actions} {s.range ? `| Range: ${s.range}` : ''} {s.saving_throw ? `| Save: ${s.saving_throw}` : ''}
                      </div>
                      {s.description && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          {s.description.slice(0, 110)}...
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        className="pb-roll-btn"
                        onClick={() => onRollDice(`Cast ${s.name}`, s.rank === 0 ? `1d20+${spellAttack}` : '1d20', 0)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Cast Spell
                      </button>
                      <button
                        onClick={() => handleToggleSpell(s)}
                        style={{ fontSize: '0.68rem', color: 'var(--red-500)', textAlign: 'center', padding: '2px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Spell Catalog Browser */}
        <div className="pb-card">
          <div className="pb-card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="pb-card-title">
                <Search size={18} />
                <span>Spell Library &amp; Grimoire ({filteredSpells.length})</span>
              </span>
              <select 
                value={selectedTradition} 
                onChange={(e) => setSelectedTradition(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                <option value="All">All Traditions</option>
                <option value="Arcane">Arcane</option>
                <option value="Divine">Divine</option>
                <option value="Primal">Primal</option>
                <option value="Occult">Occult</option>
              </select>
            </div>

            <input 
              type="text"
              placeholder="Search spells by name or effect..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            />

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {ranksList.map(rk => (
                <button
                  key={rk}
                  className={`pb-action-btn ${selectedRank === rk ? 'active' : ''}`}
                  onClick={() => setSelectedRank(rk)}
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem' }}
                >
                  {rk === '0' ? 'Cantrip' : rk === 'All' ? 'All' : `R${rk}`}
                </button>
              ))}
            </div>
          </div>

          <div className="pb-card-body" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredSpells.slice(0, 50).map((spell) => {
                const prepared = isSpellPrepared(spell);
                const trads = Array.isArray(spell.tradition) ? spell.tradition.join(', ') : spell.tradition;
                return (
                  <div
                    key={spell.id}
                    className={`pb-select-card ${prepared ? 'selected' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="pb-select-card-name">{spell.name}</div>
                      <span className="pb-pill-tag" style={{ fontSize: '0.65rem' }}>
                        {spell.rank === 0 ? 'Cantrip' : `Rank ${spell.rank}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', marginTop: 2 }}>
                      Actions: {spell.actions} &bull; {trads || 'Traditions'} {spell.saving_throw ? `| Save: ${spell.saving_throw}` : ''}
                    </div>
                    <div className="pb-select-card-desc" style={{ marginTop: 4 }}>
                      {spell.description}
                    </div>
                    <button
                      className={`pb-action-btn ${prepared ? 'active' : ''}`}
                      onClick={() => handleToggleSpell(spell)}
                      style={{ marginTop: 8, justifyContent: 'center' }}
                    >
                      {prepared ? '✓ Prepared' : '+ Prepare Spell'}
                    </button>
                  </div>
                );
              })}
              {filteredSpells.length > 50 && (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                  Showing top 50 of {filteredSpells.length} spells. Use search or rank filters to narrow results.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

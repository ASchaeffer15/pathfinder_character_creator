import React from 'react';
import { 
  Sword, Shield, ShieldAlert, Sparkles, ChevronRight, Dices, Info
} from 'lucide-react';
import { SKILLS_LIST, WEAPONS_DB } from '../data/rulesData';

export default function CharacterSheet({ 
  character, 
  onUpdateCharacter, 
  onRollDice 
}) {
  const abilities = [
    { key: 'strength', short: 'STR', name: 'Strength', ...character.abilities.strength },
    { key: 'dexterity', short: 'DEX', name: 'Dexterity', ...character.abilities.dexterity },
    { key: 'constitution', short: 'CON', name: 'Constitution', ...character.abilities.constitution },
    { key: 'intelligence', short: 'INT', name: 'Intelligence', ...character.abilities.intelligence },
    { key: 'wisdom', short: 'WIS', name: 'Wisdom', ...character.abilities.wisdom },
    { key: 'charisma', short: 'CHA', name: 'Charisma', ...character.abilities.charisma }
  ];

  const getProfBonus = (rank) => {
    switch (rank) {
      case 'T': return 2 + character.level;
      case 'E': return 4 + character.level;
      case 'M': return 6 + character.level;
      case 'L': return 8 + character.level;
      default: return 0;
    }
  };

  const getSkillTotal = (skill) => {
    const attrKey = skill.attribute.toLowerCase() === 'str' ? 'strength' :
                    skill.attribute.toLowerCase() === 'dex' ? 'dexterity' :
                    skill.attribute.toLowerCase() === 'con' ? 'constitution' :
                    skill.attribute.toLowerCase() === 'int' ? 'intelligence' :
                    skill.attribute.toLowerCase() === 'wis' ? 'wisdom' : 'charisma';
    const attrMod = character.abilities[attrKey]?.modifier || 0;
    const rank = character.skillsProf[skill.id] || 'U';
    const profBonus = getProfBonus(rank);
    const itemBonus = 0;
    return attrMod + profBonus + itemBonus;
  };

  const handleProfChange = (skillId, rank) => {
    onUpdateCharacter({
      skillsProf: {
        ...character.skillsProf,
        [skillId]: rank
      }
    });
  };

  const toggleShield = () => {
    onUpdateCharacter({ shieldRaised: !character.shieldRaised });
  };

  return (
    <div className="pb-sheet-container">
      {/* 6 Ability Scores Bar */}
      <div className="pb-abilities-row">
        {abilities.map((ab) => (
          <div key={ab.key} className="pb-ability-card">
            <span className="pb-ability-name">{ab.short}</span>
            <span className="pb-ability-mod">
              {ab.modifier >= 0 ? `+${ab.modifier}` : ab.modifier}
            </span>
            <span className="pb-ability-score">{ab.score}</span>
            <button 
              className="pb-roll-btn" 
              style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}
              onClick={() => onRollDice(`${ab.name} Check`, `1d20${ab.modifier >= 0 ? '+' : ''}${ab.modifier}`, ab.modifier)}
              title={`Roll ${ab.name}`}
            >
              <Dices size={12} />
              <span>Roll</span>
            </button>
          </div>
        ))}
      </div>

      <div className="pb-grid-2">
        {/* Left Column: Strikes & Defenses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Strikes / Attacks Card */}
          <div className="pb-card">
            <div className="pb-card-header">
              <span className="pb-card-title">
                <Sword size={18} />
                <span>Strikes &amp; Attacks</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Multiple Attack Penalty (MAP)
              </span>
            </div>
            <div className="pb-card-body">
              {character.strikes.map((strike, idx) => {
                const isAgile = strike.traits?.includes('Agile');
                const map1 = strike.attackBonus;
                const map2 = strike.attackBonus - (isAgile ? 4 : 5);
                const map3 = strike.attackBonus - (isAgile ? 8 : 10);

                return (
                  <div key={idx} className="pb-strike-card">
                    <div className="pb-strike-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="pb-pill-tag" style={{ color: strike.type === 'Ranged' ? 'var(--blue-500)' : 'var(--text-gold)', fontSize: '0.65rem', fontWeight: 700 }}>
                          {strike.type || (strike.traits?.some(t => t.toLowerCase().includes('range') || t.toLowerCase().includes('thrown') || t.toLowerCase().includes('volley')) ? 'Ranged' : 'Melee')}
                        </span>
                        <span className="pb-strike-title">{strike.name}</span>
                      </div>
                      <div className="pb-strike-traits">
                        {strike.traits?.map((t, tIdx) => (
                          <span key={tIdx} className="pb-trait-pill">{t}</span>
                        ))}
                      </div>
                    </div>

                    <div className="pb-strike-actions">
                      <button 
                        className="map-btn"
                        onClick={() => onRollDice(`${strike.name} 1st Strike`, `1d20+${map1}`, map1)}
                      >
                        <span className="map-label">1st</span>
                        <span className="map-bonus">+{map1}</span>
                      </button>

                      <button 
                        className="map-btn"
                        onClick={() => onRollDice(`${strike.name} 2nd MAP`, `1d20+${map2}`, map2)}
                      >
                        <span className="map-label">2nd ({isAgile ? '-4' : '-5'})</span>
                        <span className="map-bonus">{map2 >= 0 ? `+${map2}` : map2}</span>
                      </button>

                      <button 
                        className="map-btn"
                        onClick={() => onRollDice(`${strike.name} 3rd MAP`, `1d20+${map3}`, map3)}
                      >
                        <span className="map-label">3rd ({isAgile ? '-8' : '-10'})</span>
                        <span className="map-bonus">{map3 >= 0 ? `+${map3}` : map3}</span>
                      </button>

                      <button 
                        className="strike-damage-box"
                        onClick={() => onRollDice(`${strike.name} Damage`, strike.damageFormula, 0)}
                        title="Click to roll weapon damage"
                      >
                        <Dices size={14} style={{ marginRight: 4 }} />
                        <span>{strike.damageFormula}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Armor, Shield & Defenses Card */}
          <div className="pb-card">
            <div className="pb-card-header">
              <span className="pb-card-title">
                <Shield size={18} />
                <span>Armor &amp; Shield Defenses</span>
              </span>
              <button 
                className={`pb-action-btn ${character.shieldRaised ? 'active' : ''}`}
                style={{
                  background: character.shieldRaised ? 'rgba(16, 185, 129, 0.2)' : '',
                  borderColor: character.shieldRaised ? '#10b981' : '',
                  color: character.shieldRaised ? '#10b981' : ''
                }}
                onClick={toggleShield}
              >
                {character.shieldRaised ? 'Shield Raised (+2 AC)' : 'Raise Shield'}
              </button>
            </div>
            <div className="pb-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Armor Type</div>
                  <div style={{ fontWeight: 600 }}>{character.armorName}</div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Armor Bonus / Dex Cap</div>
                  <div style={{ fontWeight: 600 }}>+{character.armorBonus} (Cap +{character.dexCap})</div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Shield Hardness / HP</div>
                  <div style={{ fontWeight: 600 }}>H: 5 | HP: 20/20</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Reaction: Shield Block</strong><br />
                Trigger: While shield is raised, you take physical damage. Reduce damage taken by shield hardness (5). Both you and the shield take any remaining damage.
              </div>
            </div>
          </div>

          {/* Class DC & Perception Details */}
          <div className="pb-card">
            <div className="pb-card-header">
              <span className="pb-card-title">
                <Sparkles size={18} />
                <span>Class DC &amp; Senses</span>
              </span>
            </div>
            <div className="pb-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Class DC ({character.level >= 17 ? 'Master' : character.level >= 9 ? 'Expert' : 'Trained'})</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-gold)', fontFamily: 'var(--font-mono)' }}>
                  {(() => {
                    const keyAttr = character.class === 'Wizard' ? 'intelligence' :
                                    character.class === 'Rogue' ? 'dexterity' :
                                    ['Druid', 'Cleric'].includes(character.class) ? 'wisdom' :
                                    ['Bard', 'Sorcerer', 'Oracle'].includes(character.class) ? 'charisma' : 'strength';
                    const keyMod = character.abilities?.[keyAttr]?.modifier ?? character.abilities?.strength?.modifier ?? 0;
                    const profVal = character.level >= 17 ? 6 : character.level >= 9 ? 4 : 2;
                    return 10 + character.level + profVal + keyMod;
                  })()}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>10 + Lvl + Prof + Key Ability</div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '0.6rem', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Senses</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: 4 }}>
                  {character.senses || 'Low-Light Vision'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>From {character.ancestry} ancestry</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Skills List */}
        <div>
          <div className="pb-card">
            <div className="pb-card-header">
              <span className="pb-card-title">
                <span>Skills Proficiency &amp; Modifiers</span>
              </span>
              <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.7rem' }}>
                <span className="pb-pill-tag">U = Untrained</span>
                <span className="pb-pill-tag" style={{ color: '#3b82f6' }}>T = Trained (+2)</span>
                <span className="pb-pill-tag" style={{ color: '#8b5cf6' }}>E = Expert (+4)</span>
                <span className="pb-pill-tag" style={{ color: '#f59e0b' }}>M = Master (+6)</span>
                <span className="pb-pill-tag" style={{ color: '#ef4444' }}>L = Leg (+8)</span>
              </div>
            </div>
            <div className="pb-card-body" style={{ padding: 0 }}>
              <table className="pb-skills-table">
                <tbody>
                  {SKILLS_LIST.map((skill) => {
                    const total = getSkillTotal(skill);
                    const currentRank = character.skillsProf[skill.id] || 'U';

                    return (
                      <tr key={skill.id} className="pb-skill-row">
                        <td className="pb-skill-cell">
                          <div className="pb-skill-name">
                            <span>{skill.name}</span>
                            <span className="pb-skill-attr">({skill.attribute})</span>
                          </div>
                        </td>

                        <td className="pb-skill-cell">
                          <div className="prof-pills">
                            {['U', 'T', 'E', 'M', 'L'].map((rank) => (
                              <button
                                key={rank}
                                className={`prof-btn ${rank.toLowerCase()} ${currentRank === rank ? 'active' : ''}`}
                                onClick={() => handleProfChange(skill.id, rank)}
                                title={`Set ${skill.name} to ${rank}`}
                              >
                                {rank}
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="pb-skill-cell">
                          <span className="pb-skill-mod">
                            {total >= 0 ? `+${total}` : total}
                          </span>
                        </td>

                        <td className="pb-skill-cell" style={{ textAlign: 'right' }}>
                          <button
                            className="pb-roll-btn"
                            onClick={() => onRollDice(`${skill.name} Check`, `1d20${total >= 0 ? '+' : ''}${total}`, total)}
                            title={`Roll ${skill.name}`}
                          >
                            <Dices size={13} />
                            <span>Roll</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

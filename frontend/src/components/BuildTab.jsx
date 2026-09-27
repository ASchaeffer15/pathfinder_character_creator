import React, { useState, useEffect } from 'react';
import { 
  Check, ChevronDown, ChevronRight, User, Shield, Briefcase, Zap, Plus, Minus, 
  AlertCircle, Lock, Unlock, Sparkles, Search, Award, Hammer, Heart, Star, Compass
} from 'lucide-react';
import srdData from '../data/srdRemasterData.json';

export default function BuildTab({ character, onUpdateCharacter }) {
  // Active Level view / accordion (defaults to character.level e.g. 19)
  const [activeLevelView, setActiveLevelView] = useState(character.level || 1);
  const [selectedL1Step, setSelectedL1Step] = useState('ancestry'); // ancestry, background, class, boosts, feats

  // Sync active view when character level updates (e.g. from chat build or level up)
  useEffect(() => {
    if (character.level) {
      setActiveLevelView(character.level);
    }
  }, [character.level]);
  
  // Search filters for the massive SRD lists
  const [bgSearch, setBgSearch] = useState('');
  const [ancestrySearch, setAncestrySearch] = useState('');
  const [ancestryFilter, setAncestryFilter] = useState('all'); // all, core

  const ancestries = srdData.ancestries || [];
  const backgrounds = srdData.backgrounds || [];
  const classes = srdData.classes || [];
  const archetypes = srdData.archetypes || [];
  const classFeatsDb = srdData.class_feats || {};
  const skillFeatsDb = srdData.skill_feats || {};
  const generalFeatsDb = srdData.general_feats || {};
  const ancestryFeatsDb = srdData.ancestry_feats || {};
  const archetypeFeatsDb = srdData.archetype_feats || {};
  const [archSearch, setArchSearch] = useState('');

  // Find active selections
  const currentAncestry = ancestries.find(a => a.name.toLowerCase() === character.ancestry.toLowerCase()) || ancestries[0] || { name: character.ancestry, heritages: [] };
  const currentBackground = backgrounds.find(b => b.name.toLowerCase() === character.background.toLowerCase()) || backgrounds[0] || { name: character.background, boosts: [], skill: '', feat: '' };
  const currentClass = classes.find(c => c.name.toLowerCase() === character.class.toLowerCase()) || classes[0] || { name: character.class, hpPerLevel: 10 };

  // Calculate HP gain per level
  const conMod = character.abilities?.constitution?.modifier ?? 2;
  const hpGainPerLevel = (currentClass.hpPerLevel || 10) + conMod;

  // Level Up / De-Level Handlers
  const handleLevelUp = () => {
    if (character.level >= 20) return;
    const newLvl = character.level + 1;
    onUpdateCharacter({
      level: newLvl,
      maxHp: character.maxHp + hpGainPerLevel,
      currentHp: character.currentHp + hpGainPerLevel
    });
    setActiveLevelView(newLvl);
  };

  const handleDelevel = () => {
    if (character.level <= 1) return;
    const newLvl = character.level - 1;
    onUpdateCharacter({
      level: newLvl,
      maxHp: Math.max(10, character.maxHp - hpGainPerLevel),
      currentHp: Math.max(1, Math.min(character.currentHp, character.maxHp - hpGainPerLevel))
    });
    if (activeLevelView > newLvl) {
      setActiveLevelView(newLvl);
    }
  };

  // Step 1: Select Ancestry
  const handleSelectAncestry = (anc) => {
    const defaultHeritage = anc.heritages && anc.heritages[0] ? anc.heritages[0].name : "Versatile Heritage";
    const hp = anc.hp || 8;
    onUpdateCharacter({
      ancestry: anc.name,
      heritage: defaultHeritage,
      speed: anc.speed || 25,
      senses: anc.name === "Elf" ? "Low-Light Vision" : anc.name === "Dwarf" || anc.name === "Goblin" || anc.name === "Orc" ? "Darkvision" : "Normal Vision",
      maxHp: hp + (currentClass.hpPerLevel * character.level) + (conMod * character.level),
      currentHp: hp + (currentClass.hpPerLevel * character.level) + (conMod * character.level)
    });
  };

  const handleSelectHeritage = (her) => {
    onUpdateCharacter({ heritage: her.name });
  };

  // Step 2: Select Background
  const handleSelectBackground = (bg) => {
    const rawSkill = (typeof bg.skill === 'string' && bg.skill) ? bg.skill : 'Athletics';
    const skillKey = rawSkill.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    onUpdateCharacter({
      background: bg.name,
      skillsProf: {
        ...character.skillsProf,
        [skillKey]: 'T'
      }
    });
  };

  // Step 3: Select Class
  const handleSelectClass = (cls) => {
    const ancHp = currentAncestry.hp || 8;
    const totalHp = ancHp + (cls.hpPerLevel * character.level) + (conMod * character.level);
    onUpdateCharacter({
      class: cls.name,
      hpPerLevel: cls.hpPerLevel,
      maxHp: totalHp,
      currentHp: totalHp,
      savesProf: {
        fortitude: cls.fortitudeProf || "Trained",
        reflex: cls.reflexProf || "Trained",
        will: cls.willProf || "Trained"
      }
    });
  };

  // Step 4: Toggle Free Boosts
  const toggleFreeBoost = (abilityKey) => {
    const activeBoosts = character.freeBoosts || [];
    let updated;
    if (activeBoosts.includes(abilityKey)) {
      updated = activeBoosts.filter(k => k !== abilityKey);
    } else {
      if (activeBoosts.length >= 4) {
        alert("You already selected 4 Free Attribute Boosts for Level 1!");
        return;
      }
      updated = [...activeBoosts, abilityKey];
    }

    // Recalculate Ability Scores
    const baseScores = { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };
    
    // Class Key Boost
    if (character.class === "Fighter" || character.class === "Barbarian" || character.class === "Champion") {
      baseScores.strength += 2;
    } else if (character.class === "Wizard" || character.class === "Witch" || character.class === "Alchemist") {
      baseScores.intelligence += 2;
    } else if (character.class === "Rogue" || character.class === "Swashbuckler" || character.class === "Gunslinger") {
      baseScores.dexterity += 2;
    } else if (character.class === "Cleric" || character.class === "Druid") {
      baseScores.wisdom += 2;
    } else if (character.class === "Bard" || character.class === "Sorcerer") {
      baseScores.charisma += 2;
    }

    // Background Boosts
    if (currentBackground.boosts && currentBackground.boosts.length > 0) {
      const bKey = currentBackground.boosts[0].toLowerCase();
      if (baseScores[bKey] !== undefined) baseScores[bKey] += 2;
    }

    // 4 Free Boosts
    updated.forEach(k => {
      if (baseScores[k] !== undefined) baseScores[k] += 2;
    });

    const newAbilities = {};
    for (const [k, score] of Object.entries(baseScores)) {
      newAbilities[k] = {
        score,
        modifier: Math.floor((score - 10) / 2)
      };
    }

    onUpdateCharacter({
      freeBoosts: updated,
      abilities: newAbilities,
      ac: 10 + (newAbilities.dexterity?.modifier || 0) + (character.armorBonus || 0)
    });
  };

  // Add / Choose Feat Handler with Toggle Support
  const handleSelectFeat = (featObj, levelTag = "") => {
    const existingFeats = character.feats || [];
    const isSelected = existingFeats.some(f => f.name.toLowerCase() === featObj.name.toLowerCase());
    if (isSelected) {
      onUpdateCharacter({
        feats: existingFeats.filter(f => f.name.toLowerCase() !== featObj.name.toLowerCase())
      });
      return;
    }

    let fType = featObj.type || "Class";
    if (levelTag.includes("Skill")) fType = "Skill";
    else if (levelTag.includes("General")) fType = "General";
    else if (levelTag.includes("Ancestry")) fType = "Ancestry";
    else if (levelTag.includes("Archetype")) fType = "Archetype";

    const newFeat = {
      id: featObj.id || featObj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: featObj.name,
      type: fType,
      level: featObj.level || character.level,
      actions: featObj.actions || 0,
      tags: featObj.tags || [],
      skill: featObj.skill || "",
      prerequisite: featObj.prerequisite || "",
      description: featObj.description || ""
    };

    const dedMatch = featObj.name.match(/^(.+?)\s+Dedication$/i);
    const updates = { feats: [...existingFeats, newFeat] };
    if (dedMatch && !character.archetype) {
      updates.archetype = dedMatch[1].trim();
      if (dedMatch[1].trim().toLowerCase() === 'medic') {
        updates.skillsProf = { ...character.skillsProf, medicine: 'E' };
      } else if (dedMatch[1].trim().toLowerCase() === 'acrobat') {
        updates.skillsProf = { ...character.skillsProf, acrobatics: 'E' };
      }
    }
    onUpdateCharacter(updates);
  };

  const handleSelectArchetype = (archName) => {
    if (character.archetype?.toLowerCase() === archName.toLowerCase()) {
      onUpdateCharacter({ archetype: null });
      return;
    }
    const archKey = archName.toLowerCase();
    const archFeats = archetypeFeatsDb[archKey] || {};
    let dedFeat = null;
    for (const flist of Object.values(archFeats)) {
      const f = flist.find(x => x.name.toLowerCase().includes('dedication'));
      if (f) { dedFeat = f; break; }
    }
    const existingFeats = character.feats || [];
    let updatedFeats = [...existingFeats];
    if (dedFeat && !existingFeats.some(f => f.name.toLowerCase() === dedFeat.name.toLowerCase())) {
      updatedFeats.push({
        id: dedFeat.id || dedFeat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: dedFeat.name,
        type: 'Archetype',
        level: dedFeat.level || 2,
        actions: dedFeat.actions || 0,
        tags: dedFeat.tags || ['Archetype', 'Dedication'],
        skill: dedFeat.skill || '',
        prerequisite: dedFeat.prerequisite || '',
        description: dedFeat.description || ''
      });
    }
    const updates = {
      archetype: archName,
      feats: updatedFeats
    };
    if (archKey === 'medic') {
      updates.skillsProf = { ...character.skillsProf, medicine: 'E' };
    } else if (archKey === 'acrobat') {
      updates.skillsProf = { ...character.skillsProf, acrobatics: 'E' };
    }
    onUpdateCharacter(updates);
  };

  const isFeatSelected = (featName) => {
    return (character.feats || []).some(f => f.name.toLowerCase() === featName.toLowerCase());
  };

  // Filtered Ancestries
  const filteredAncestries = ancestries.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(ancestrySearch.toLowerCase());
    if (ancestryFilter === 'core') {
      return matchesSearch && ['Human', 'Dwarf', 'Elf', 'Gnome', 'Goblin', 'Halfling', 'Orc', 'Leshy'].includes(a.name);
    }
    return matchesSearch;
  });

  // Filtered Backgrounds
  const filteredBackgrounds = backgrounds.filter(b => 
    b.name?.toLowerCase().includes(bgSearch.toLowerCase()) || 
    b.skill?.toLowerCase()?.includes(bgSearch.toLowerCase()) ||
    b.feat?.toLowerCase()?.includes(bgSearch.toLowerCase())
  );

  return (
    <div className="pb-build-container" style={{ padding: '0.25rem 0' }}>
      
      {/* ========================================================
          STICKY LEVEL CONTROL & ROADWAY HIGHWAY
      ======================================================== */}
      <div className="pb-card" style={{ 
        marginBottom: '1.25rem', 
        border: '1px solid var(--border-gold)',
        boxShadow: 'var(--shadow-gold)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: '#141822'
      }}>
        <div className="pb-card-header" style={{ padding: '0.65rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Hammer size={20} color="var(--gold-500)" />
            <div>
              <span className="pb-card-title" style={{ fontSize: '1.05rem', margin: 0 }}>
                Pathfinder 2e Remaster Character Builder
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>
                SRD Vault Powered: Levels 1–20 Progressive Level Gating
              </span>
            </div>
          </div>

          {/* Level Up / De-Level Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="pb-btn pb-btn-secondary"
              onClick={handleDelevel}
              disabled={character.level <= 1}
              title="De-Level Character by 1"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Minus size={13} />
              <span>De-Level</span>
            </button>

            <div style={{ 
              background: 'linear-gradient(135deg, var(--gold-600) 0%, var(--gold-500) 100%)',
              color: '#121620',
              fontWeight: 800,
              fontSize: '1rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
            }}>
              <Star size={16} />
              <span>Level {character.level}</span>
            </div>

            <button
              className="pb-btn pb-btn-primary"
              onClick={handleLevelUp}
              disabled={character.level >= 20}
              title="Level Up Character by 1"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}
            >
              <Plus size={14} />
              <span>Level Up!</span>
            </button>
          </div>
        </div>

        {/* 1-20 Level Track Chips */}
        <div style={{ padding: '0.5rem 1.25rem', background: '#0d1017', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflowX: 'auto', paddingBottom: 4 }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginRight: 4 }}>
              Progression Highway:
            </span>
            <button
              onClick={() => setActiveLevelView('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: activeLevelView === 'all' ? 800 : 600,
                cursor: 'pointer',
                border: activeLevelView === 'all' ? '1px solid var(--gold-500)' : '1px solid rgba(255, 255, 255, 0.1)',
                background: activeLevelView === 'all' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: activeLevelView === 'all' ? 'var(--text-gold)' : 'var(--text-secondary)',
                marginRight: 6
              }}
              title="Show all level tiers stacked"
            >
              <Compass size={12} />
              <span>All Levels</span>
            </button>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
              const isUnlocked = lvl <= character.level;
              const isCurrent = lvl === character.level;
              const isViewed = lvl === activeLevelView;

              return (
                <button
                  key={lvl}
                  onClick={() => setActiveLevelView(lvl)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: isCurrent ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isViewed 
                      ? '1px solid var(--gold-500)' 
                      : isUnlocked 
                        ? '1px solid rgba(16, 185, 129, 0.4)' 
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isViewed
                      ? 'rgba(245, 158, 11, 0.2)'
                      : isUnlocked
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(255, 255, 255, 0.03)',
                    color: isUnlocked ? '#f3f4f6' : 'var(--text-muted)',
                    opacity: isUnlocked ? 1 : 0.45
                  }}
                  title={isUnlocked ? `Level ${lvl} (Unlocked)` : `Level ${lvl} (Locked until Level Up)`}
                >
                  {isUnlocked ? (
                    <Check size={10} color="#10b981" />
                  ) : (
                    <Lock size={10} color="var(--text-muted)" />
                  )}
                  <span>Lv {lvl}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================
          ACTIVE LEVEL VIEW: LEVEL 1 (FOUNDATION)
      ======================================================== */}
      {(activeLevelView === 1 || activeLevelView === 'all') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="pb-card" style={{ borderLeft: '4px solid var(--gold-500)' }}>
            <div className="pb-card-header">
              <span className="pb-card-title">
                <Sparkles size={18} color="var(--gold-500)" />
                <span>Level 1: Foundational Character Building</span>
              </span>
              <span className="pb-pill-tag" style={{ color: '#10b981' }}>
                Unlocked (Active Level)
              </span>
            </div>
            <div className="pb-card-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Step through your foundational Pathfinder 2e Remaster choices: Ancestry, Background, Class, 4 Free Attribute Boosts, and 1st-Level Feats.
              </p>
            </div>
          </div>

          {/* Step 1: Ancestry & Heritage */}
          <div className="pb-build-step">
            <div 
              className="pb-build-step-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedL1Step(selectedL1Step === 'ancestry' ? '' : 'ancestry')}
            >
              <div className="pb-build-step-title">
                <span className="pb-step-badge">1</span>
                <span>Ancestry &amp; Heritage: <strong>{character.ancestry}</strong> ({character.heritage})</span>
              </div>
              {selectedL1Step === 'ancestry' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>

            {selectedL1Step === 'ancestry' && (
              <div className="pb-build-step-body">
                {/* Search & Filter Bar */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search 36 Remaster Ancestries (e.g. Human, Dwarf, Leshy, Orc)..."
                      value={ancestrySearch}
                      onChange={(e) => setAncestrySearch(e.target.value)}
                      style={{ width: '100%', paddingLeft: 32, fontSize: '0.82rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button 
                      className={`pb-tab-btn ${ancestryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setAncestryFilter('all')}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      All ({ancestries.length})
                    </button>
                    <button 
                      className={`pb-tab-btn ${ancestryFilter === 'core' ? 'active' : ''}`}
                      onClick={() => setAncestryFilter('core')}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                    >
                      Core Remaster
                    </button>
                  </div>
                </div>

                {/* Ancestries Grid */}
                <div className="pb-select-grid" style={{ maxHeight: 320, overflowY: 'auto', marginBottom: '1.25rem' }}>
                  {filteredAncestries.map((anc) => (
                    <div
                      key={anc.id}
                      className={`pb-select-card ${character.ancestry.toLowerCase() === anc.name.toLowerCase() ? 'selected' : ''}`}
                      onClick={() => handleSelectAncestry(anc)}
                    >
                      <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{anc.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-gold)' }}>{anc.hp} HP</span>
                      </div>
                      <div className="pb-select-card-desc">{anc.description || `${anc.size} | ${anc.speed} ft Speed`}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        Speed: {anc.speed} ft | Size: {anc.size}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heritages for chosen ancestry */}
                {currentAncestry.heritages && currentAncestry.heritages.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.5rem' }}>
                      Select Heritage for {character.ancestry}:
                    </div>
                    <div className="pb-select-grid">
                      {currentAncestry.heritages.map((her) => (
                        <div
                          key={her.id}
                          className={`pb-select-card ${character.heritage.toLowerCase() === her.name.toLowerCase() ? 'selected' : ''}`}
                          onClick={() => handleSelectHeritage(her)}
                        >
                          <div className="pb-select-card-name">{her.name}</div>
                          <div className="pb-select-card-desc">{her.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Background */}
          <div className="pb-build-step">
            <div 
              className="pb-build-step-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedL1Step(selectedL1Step === 'background' ? '' : 'background')}
            >
              <div className="pb-build-step-title">
                <span className="pb-step-badge">2</span>
                <span>Background: <strong>{character.background}</strong></span>
              </div>
              {selectedL1Step === 'background' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>

            {selectedL1Step === 'background' && (
              <div className="pb-build-step-body">
                {/* Search Input for 389 Backgrounds */}
                <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search 389 Remaster Backgrounds (e.g. Warrior, Acolyte, Field Medic, Bounty Hunter)..."
                    value={bgSearch}
                    onChange={(e) => setBgSearch(e.target.value)}
                    style={{ width: '100%', paddingLeft: 32, fontSize: '0.82rem' }}
                  />
                </div>

                <div className="pb-select-grid" style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {filteredBackgrounds.slice(0, 30).map((bg) => (
                    <div
                      key={bg.id}
                      className={`pb-select-card ${character.background.toLowerCase() === bg.name.toLowerCase() ? 'selected' : ''}`}
                      onClick={() => handleSelectBackground(bg)}
                    >
                      <div className="pb-select-card-name">{bg.name}</div>
                      <div className="pb-select-card-desc">{bg.description}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', marginTop: 4 }}>
                        Boosts: {bg.boosts.join(' or ')} + Free | Skill: {bg.skill}
                      </div>
                      {bg.feat && (
                        <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: 2 }}>
                          ✓ Feat: {bg.feat}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {filteredBackgrounds.length > 30 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
                    Showing first 30 of {filteredBackgrounds.length} matching backgrounds. Use search box to filter further.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Class */}
          <div className="pb-build-step">
            <div 
              className="pb-build-step-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedL1Step(selectedL1Step === 'class' ? '' : 'class')}
            >
              <div className="pb-build-step-title">
                <span className="pb-step-badge">3</span>
                <span>Class: <strong>{character.class}</strong> ({currentClass.hpPerLevel} HP/Level)</span>
              </div>
              {selectedL1Step === 'class' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>

            {selectedL1Step === 'class' && (
              <div className="pb-build-step-body">
                <div className="pb-select-grid">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`pb-select-card ${character.class.toLowerCase() === cls.name.toLowerCase() ? 'selected' : ''}`}
                      onClick={() => handleSelectClass(cls)}
                    >
                      <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{cls.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-gold)' }}>{cls.hpPerLevel} HP/Lvl</span>
                      </div>
                      <div className="pb-select-card-desc">{cls.description}</div>
                      <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: 4 }}>
                        Key: {cls.keyAbility ? cls.keyAbility.join(', ') : 'Primary'} | Attacks: {cls.attacks}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Ability Boosts */}
          <div className="pb-build-step">
            <div 
              className="pb-build-step-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedL1Step(selectedL1Step === 'boosts' ? '' : 'boosts')}
            >
              <div className="pb-build-step-title">
                <span className="pb-step-badge">4</span>
                <span>Initial Attribute Boosts: <strong>{(character.freeBoosts || []).length}/4 Selected</strong></span>
              </div>
              {selectedL1Step === 'boosts' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>

            {selectedL1Step === 'boosts' && (
              <div className="pb-build-step-body">
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  At 1st level, select <strong>4 Free Attribute Boosts</strong> to define your hero's raw physical and mental power:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((key) => {
                    const isSelected = (character.freeBoosts || []).includes(key);
                    const currentVal = character.abilities?.[key]?.score || 10;
                    const mod = character.abilities?.[key]?.modifier || 0;

                    return (
                      <div
                        key={key}
                        onClick={() => toggleFreeBoost(key)}
                        style={{
                          background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-primary)',
                          border: isSelected ? '1px solid var(--gold-500)' : '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '0.85rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: isSelected ? 'var(--text-gold)' : 'var(--text-muted)' }}>
                          {key}
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f3f4f6', margin: '4px 0' }}>
                          {currentVal}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: isSelected ? '#10b981' : 'var(--text-secondary)' }}>
                          {mod >= 0 ? `+${mod}` : mod} Mod
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <span className={`pb-pill-tag ${isSelected ? 'selected' : ''}`} style={{ fontSize: '0.65rem' }}>
                            {isSelected ? '✓ Boosted (+2)' : '+ Boost'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 5: Level 1 Feats */}
          <div className="pb-build-step">
            <div 
              className="pb-build-step-header" 
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedL1Step(selectedL1Step === 'feats' ? '' : 'feats')}
            >
              <div className="pb-build-step-title">
                <span className="pb-step-badge">5</span>
                <span>Level 1 Class &amp; Ancestry Feats</span>
              </div>
              {selectedL1Step === 'feats' ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>

            {selectedL1Step === 'feats' && (
              <div className="pb-build-step-body">
                <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Available Level 1 Class Feats for {character.class}:
                </div>
                <div className="pb-select-grid" style={{ marginBottom: '1.25rem' }}>
                  {(classFeatsDb[character.class.toLowerCase()]?.[1] || []).map((feat) => {
                    const selected = isFeatSelected(feat.name);
                    return (
                      <div
                        key={feat.id}
                        className={`pb-select-card ${selected ? 'selected' : ''}`}
                        onClick={() => handleSelectFeat(feat, "Level 1")}
                      >
                        <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{feat.name}</span>
                          {selected && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓ Selected</span>}
                        </div>
                        <div className="pb-select-card-desc">{feat.description}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Actions: {feat.actions} {feat.tags?.length > 0 && `| [${feat.tags.join(', ')}]`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Available Level 1 Ancestry Feats for {character.ancestry}:
                </div>
                <div className="pb-select-grid">
                  {(ancestryFeatsDb[character.ancestry.toLowerCase()]?.[1] || ancestryFeatsDb["human"]?.[1] || []).map((feat) => {
                    const selected = isFeatSelected(feat.name);
                    return (
                      <div
                        key={feat.id}
                        className={`pb-select-card ${selected ? 'selected' : ''}`}
                        onClick={() => handleSelectFeat(feat, "Level 1 Ancestry")}
                      >
                        <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{feat.name}</span>
                          {selected && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓ Selected</span>}
                        </div>
                        <div className="pb-select-card-desc">{feat.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          PROGRESSIVE LEVELS (LEVEL 2 TO 20)
      ======================================================== */}
      {Array.from({ length: 19 }, (_, i) => i + 2).map((lvl) => {
        const isUnlocked = lvl <= character.level;
        const isFocused = activeLevelView === lvl;

        // Feat lists for this level
        const classFeatsForLvl = classFeatsDb[character.class.toLowerCase()]?.[lvl] || [];
        const skillFeatsForLvl = skillFeatsDb[lvl] || [];
        const generalFeatsForLvl = generalFeatsDb[lvl] || [];
        const ancestryFeatsForLvl = ancestryFeatsDb[character.ancestry.toLowerCase()]?.[lvl] || ancestryFeatsDb["human"]?.[lvl] || [];

        // Has 4 ability boosts at 5, 10, 15, 20
        const isBoostLevel = [5, 10, 15, 20].includes(lvl);

        return (
          <div
            key={lvl}
            style={{
              marginBottom: '1rem',
              opacity: isUnlocked ? 1 : 0.55,
              transition: 'opacity 0.2s ease',
              display: (activeLevelView === lvl || activeLevelView === 'all') ? 'block' : 'none'
            }}
          >
            <div className="pb-card" style={{
              border: isUnlocked ? '1px solid var(--border-medium)' : '1px dashed var(--border-subtle)',
              background: isUnlocked ? '#141822' : '#0e1118'
            }}>
              {/* Level Tier Header */}
              <div className="pb-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    background: isUnlocked ? 'var(--gold-500)' : '#334155',
                    color: isUnlocked ? '#121620' : '#94a3b8',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {isUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                    <span>Level {lvl}</span>
                  </div>
                  <span className="pb-card-title" style={{ fontSize: '0.95rem' }}>
                    {lvl === 5 || lvl === 10 || lvl === 15 || lvl === 20 
                      ? `Major Milestone: 4 Attribute Boosts & Specialization` 
                      : `Tier ${lvl} Progression & Feats`}
                  </span>
                </div>

                <div>
                  {isUnlocked ? (
                    <span className="pb-pill-tag" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} />
                      <span>Unlocked &amp; Active</span>
                    </span>
                  ) : (
                    <button
                      className="pb-btn pb-btn-primary"
                      onClick={handleLevelUp}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.65rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={12} />
                      <span>Unlock at Level {lvl} (Level Up)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Level Tier Body */}
              <div className="pb-card-body">
                {isUnlocked ? (
                  /* ================= UNLOCKED CONTENT ================= */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Level Stat Gains Banner */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem'
                    }}>
                      <Heart size={16} color="#10b981" />
                      <span><strong>Hit Points Gained:</strong> +{hpGainPerLevel} HP ({currentClass.hpPerLevel} from {currentClass.name} + {conMod} Constitution Mod)</span>
                    </div>

                    {/* Milestone Attribute Boosts (Levels 5, 10, 15, 20) */}
                    {isBoostLevel && (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '8px',
                        padding: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <Star size={16} color="var(--gold-500)" />
                          <strong style={{ color: 'var(--text-gold)', fontSize: '0.88rem' }}>
                            Level {lvl} Attribute Boosts (Boost 4 Attributes)
                          </strong>
                        </div>
                        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          At 5th, 10th, 15th, and 20th level, boost four different attribute scores. Scores under 18 increase by +2; scores 18 or higher increase by +1.
                        </p>
                      </div>
                    )}

                    {/* Level 2 Archetype Dedication Selector */}
                    {lvl === 2 && (
                      <div style={{
                        background: 'rgba(56, 189, 248, 0.05)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: '8px',
                        padding: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Compass size={16} color="#38bdf8" />
                            <strong style={{ color: '#38bdf8', fontSize: '0.88rem' }}>
                              Archetype Dedication (Level 2+ / Free Archetype)
                            </strong>
                          </div>
                          {character.archetype ? (
                            <span className="pb-pill-tag" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                              Active: {character.archetype}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Optional multiclass or archetype specialization
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                          Select an Archetype Dedication feat (e.g. Medic, Acrobat, Marshal, Beastmaster, Sentinel, Dual-Weapon Warrior) in place of a class feat or via Free Archetype.
                        </p>

                        <div style={{ position: 'relative', marginBottom: 8 }}>
                          <input
                            type="text"
                            placeholder="Filter archetypes (e.g. Medic, Acrobat, Marshal)..."
                            value={archSearch}
                            onChange={(e) => setArchSearch(e.target.value)}
                            style={{ paddingLeft: '2rem', width: '100%', fontSize: '0.78rem' }}
                          />
                          <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>

                        <div className="pb-select-grid" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                          {archetypes
                            .filter(a => !archSearch || a.name.toLowerCase().includes(archSearch.toLowerCase()) || (a.description && a.description.toLowerCase().includes(archSearch.toLowerCase())))
                            .slice(0, 30)
                            .map(arch => {
                              const isSelected = character.archetype?.toLowerCase() === arch.name.toLowerCase();
                              return (
                                <div
                                  key={arch.id}
                                  className={`pb-select-card ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleSelectArchetype(arch.name)}
                                  style={{ border: isSelected ? '1px solid #38bdf8' : undefined }}
                                >
                                  <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between', color: isSelected ? '#38bdf8' : undefined }}>
                                    <span>{arch.name}</span>
                                    {isSelected && <span style={{ color: '#38bdf8', fontSize: '0.7rem' }}>✓ Selected</span>}
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                                    {arch.category} | Prereq: {arch.prerequisite || 'None'}
                                  </div>
                                  <div className="pb-select-card-desc">{arch.description}</div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Archetype Feats for this level if Archetype selected */}
                    {character.archetype && archetypeFeatsDb[character.archetype.toLowerCase()]?.[lvl]?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Compass size={14} color="#38bdf8" />
                          <span>Select Level {lvl} {character.archetype} Archetype Feat:</span>
                        </div>
                        <div className="pb-select-grid">
                          {archetypeFeatsDb[character.archetype.toLowerCase()][lvl].map((feat) => {
                            const selected = isFeatSelected(feat.name);
                            return (
                              <div
                                key={feat.id || feat.name}
                                className={`pb-select-card ${selected ? 'selected' : ''}`}
                                onClick={() => handleSelectFeat(feat, `Level ${lvl} Archetype`)}
                                style={{ border: selected ? '1px solid #38bdf8' : undefined }}
                              >
                                <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{ color: selected ? '#38bdf8' : undefined }}>{feat.name}</span>
                                  {selected && <span style={{ color: '#38bdf8', fontSize: '0.7rem' }}>✓ Selected</span>}
                                </div>
                                <div className="pb-select-card-desc">{feat.description}</div>
                                {feat.prerequisite && (
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    Prereq: {feat.prerequisite}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Class Feats for this level */}
                    {classFeatsForLvl.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.5rem' }}>
                          Select Level {lvl} Class Feat ({character.class}):
                        </div>
                        <div className="pb-select-grid">
                          {classFeatsForLvl.map((feat) => {
                            const selected = isFeatSelected(feat.name);
                            return (
                              <div
                                key={feat.id}
                                className={`pb-select-card ${selected ? 'selected' : ''}`}
                                onClick={() => handleSelectFeat(feat, `Level ${lvl}`)}
                              >
                                <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{feat.name}</span>
                                  {selected && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓ Selected</span>}
                                </div>
                                <div className="pb-select-card-desc">{feat.description}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                  Actions: {feat.actions} {feat.tags?.length > 0 && `| [${feat.tags.join(', ')}]`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Skill Feats for this level */}
                    {skillFeatsForLvl.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.5rem' }}>
                          Select Level {lvl} Skill Feat ({skillFeatsForLvl.length} Options):
                        </div>
                        <div className="pb-select-grid" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                          {skillFeatsForLvl.map((feat) => {
                            const selected = isFeatSelected(feat.name);
                            return (
                              <div
                                key={feat.id || feat.name}
                                className={`pb-select-card ${selected ? 'selected' : ''}`}
                                onClick={() => handleSelectFeat(feat, `Level ${lvl} Skill`)}
                              >
                                <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{feat.name}</span>
                                  {selected && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓ Selected</span>}
                                </div>
                                <div className="pb-select-card-desc">{feat.description}</div>
                                {feat.skill && (
                                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginTop: 4 }}>
                                    Skill Requirement: {feat.skill}
                                  </div>
                                )}
                                {feat.prerequisite && (
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                    Prerequisite: {feat.prerequisite}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* General Feats for this level */}
                    {generalFeatsForLvl.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.5rem' }}>
                          Select Level {lvl} General Feat:
                        </div>
                        <div className="pb-select-grid">
                          {generalFeatsForLvl.map((feat) => {
                            const selected = isFeatSelected(feat.name);
                            return (
                              <div
                                key={feat.id}
                                className={`pb-select-card ${selected ? 'selected' : ''}`}
                                onClick={() => handleSelectFeat(feat, `Level ${lvl} General`)}
                              >
                                <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{feat.name}</span>
                                  {selected && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓ Selected</span>}
                                </div>
                                <div className="pb-select-card-desc">{feat.description}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Ancestry Feats for this level */}
                    {ancestryFeatsForLvl.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-gold)', fontWeight: 700, marginBottom: '0.5rem' }}>
                          Select Level {lvl} Ancestry Feat ({character.ancestry}):
                        </div>
                        <div className="pb-select-grid">
                          {ancestryFeatsForLvl.map((feat) => {
                            const selected = isFeatSelected(feat.name);
                            return (
                              <div
                                key={feat.id}
                                className={`pb-select-card ${selected ? 'selected' : ''}`}
                                onClick={() => handleSelectFeat(feat, `Level ${lvl} Ancestry`)}
                              >
                                <div className="pb-select-card-name" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{feat.name}</span>
                                  {selected && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓ Selected</span>}
                                </div>
                                <div className="pb-select-card-desc">{feat.description}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  /* ================= LOCKED & DISABLED STATE ================= */
                  <div style={{
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-subtle)'
                  }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem auto'
                    }}>
                      <Lock size={22} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 4 }}>
                      🔒 Level {lvl} Locked
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 1rem auto' }}>
                      This level's feats and attribute improvements are disabled until your character reaches <strong>Level {lvl}</strong>. Advance your level above to unlock this tier.
                    </p>
                    <button
                      className="pb-btn pb-btn-primary"
                      onClick={handleLevelUp}
                      style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Plus size={14} />
                      <span>Advance Character to Level {character.level + 1}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
}

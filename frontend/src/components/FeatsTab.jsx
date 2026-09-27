import React, { useState, useEffect, useMemo } from 'react';
import { Award, Plus, Trash2, Search, Filter, Check, Sparkles, BookOpen } from 'lucide-react';
import srdData from '../data/srdRemasterData.json';

export default function FeatsTab({ character, onUpdateCharacter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Class, Archetype, Skill, General, Ancestry, Custom
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState(character.archetype || 'all');
  const [customFeats, setCustomFeats] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(60);

  useEffect(() => {
    fetch('/api/feats/custom')
      .then(res => res.ok ? res.json() : { feats: [] })
      .then(data => setCustomFeats(data.feats || []))
      .catch(() => {});
  }, []);

  // Sync archetype filter if character archetype changes
  useEffect(() => {
    if (character.archetype) {
      setSelectedArchetypeFilter(character.archetype);
    }
  }, [character.archetype]);

  const archetypesList = srdData.archetypes || [];

  // Compile all available feats from the comprehensive Archives of Nethys dataset
  const allAvailableFeats = useMemo(() => {
    const classKey = character.class?.toLowerCase() || 'fighter';
    const ancKey = character.ancestry?.toLowerCase() || 'human';

    // 1. Class Feats
    const classFeats = Object.values(srdData.class_feats?.[classKey] || {})
      .flat()
      .map(f => ({ ...f, type: 'Class' }));

    // 2. Ancestry Feats
    const ancestryFeats = Object.values(srdData.ancestry_feats?.[ancKey] || srdData.ancestry_feats?.['human'] || {})
      .flat()
      .map(f => ({ ...f, type: 'Ancestry' }));

    // 3. Skill Feats
    const skillFeats = Object.values(srdData.skill_feats || {})
      .flat()
      .map(f => ({ ...f, type: 'Skill' }));

    // 4. General Feats
    const generalFeats = Object.values(srdData.general_feats || {})
      .flat()
      .map(f => ({ ...f, type: 'General' }));

    // 5. Archetype Feats
    const archetypeFeats = [];
    const archFeatsDb = srdData.archetype_feats || {};

    // Collect all dedication feats so user can browse any archetype
    for (const [archName, lvlMap] of Object.entries(archFeatsDb)) {
      for (const [lvl, fList] of Object.entries(lvlMap)) {
        for (const f of fList) {
          archetypeFeats.push({
            ...f,
            type: 'Archetype',
            archetypeName: archName.charAt(0).toUpperCase() + archName.slice(1)
          });
        }
      }
    }

    // 6. Custom Feats
    const custom = customFeats.map(f => ({ ...f, isCustom: true, type: f.type || 'Custom' }));

    // De-duplicate by feat name
    const seen = new Set();
    const result = [];
    for (const f of [...classFeats, ...archetypeFeats, ...skillFeats, ...generalFeats, ...ancestryFeats, ...custom]) {
      const lower = f.name?.toLowerCase().trim();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        result.push(f);
      }
    }
    return result;
  }, [character.class, character.ancestry, customFeats]);

  // Filtered feats
  const filteredFeats = useMemo(() => {
    return allAvailableFeats.filter(f => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
                            f.name.toLowerCase().includes(q) ||
                            (f.description && f.description.toLowerCase().includes(q)) ||
                            (f.skill && f.skill.toLowerCase().includes(q)) ||
                            (f.prerequisite && f.prerequisite.toLowerCase().includes(q));

      let matchesType = true;
      if (filterType === 'Custom') {
        matchesType = f.isCustom;
      } else if (filterType === 'Archetype') {
        matchesType = f.type === 'Archetype';
        if (matchesType && selectedArchetypeFilter !== 'all') {
          const targetArch = selectedArchetypeFilter.toLowerCase();
          const matchesArchName = f.archetypeName?.toLowerCase() === targetArch;
          const matchesArchetypeTag = Array.isArray(f.archetype) && f.archetype.some(a => a.toLowerCase() === targetArch);
          const matchesTitle = f.name.toLowerCase().includes(targetArch);
          matchesType = matchesArchName || matchesArchetypeTag || matchesTitle;
        }
      } else if (filterType !== 'All') {
        matchesType = f.type?.toLowerCase() === filterType.toLowerCase();
      }

      return matchesSearch && matchesType;
    });
  }, [allAvailableFeats, searchTerm, filterType, selectedArchetypeFilter]);

  const isFeatSelected = (feat) => {
    return character.feats?.some(f => f.name.toLowerCase() === feat.name.toLowerCase());
  };

  const handleToggleFeat = (feat) => {
    if (isFeatSelected(feat)) {
      onUpdateCharacter({
        feats: character.feats.filter(f => f.name.toLowerCase() !== feat.name.toLowerCase())
      });
    } else {
      onUpdateCharacter({
        feats: [...(character.feats || []), feat]
      });
    }
  };

  return (
    <div className="pb-feats-container">
      {/* Current Character Feats Summary */}
      <div className="pb-card" style={{ marginBottom: '1.25rem' }}>
        <div className="pb-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="pb-card-title">
            <Award size={18} />
            <span>Active Character Feats &amp; Archetypes ({character.feats?.length || 0})</span>
          </span>
          {character.archetype && (
            <span className="pb-pill-tag" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              Archetype: {character.archetype}
            </span>
          )}
        </div>
        <div className="pb-card-body">
          {(!character.feats || character.feats.length === 0) ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No feats selected yet. Browse the feat catalog below to add feats to your build!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
              {character.feats.map((feat, idx) => {
                const isArch = feat.type === 'Archetype' || feat.name.toLowerCase().includes('dedication');
                const isSkill = feat.type === 'Skill';
                return (
                  <div key={idx} style={{ 
                    background: 'var(--bg-primary)', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    border: isArch ? '1px solid rgba(56, 189, 248, 0.4)' : isSkill ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start' 
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: isArch ? '#38bdf8' : 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{feat.name}</span>
                        <span className="pb-pill-tag" style={{ 
                          fontSize: '0.65rem',
                          background: isArch ? 'rgba(56, 189, 248, 0.2)' : isSkill ? 'rgba(16, 185, 129, 0.2)' : undefined,
                          color: isArch ? '#38bdf8' : isSkill ? '#10b981' : undefined
                        }}>
                          {feat.type || 'Feat'} {feat.level ? `(Lvl ${feat.level})` : ''}
                        </span>
                      </div>
                      {feat.skill && (
                        <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginTop: 2 }}>
                          Skill: {feat.skill}
                        </div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        {feat.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFeat(feat)}
                      style={{ color: 'var(--red-500)', padding: 4 }}
                      title="Remove feat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feat Library Browser */}
      <div className="pb-card">
        <div className="pb-card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <span className="pb-card-title">
            <Filter size={18} />
            <span>Archives of Nethys Feats Codex ({filteredFeats.length} Available)</span>
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search feats, skills, prerequisites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2rem', width: '230px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['All', 'Class', 'Archetype', 'Skill', 'General', 'Ancestry', 'Custom'].map(type => (
                <button
                  key={type}
                  className={`pb-action-btn ${filterType === type ? 'active' : ''}`}
                  onClick={() => {
                    setFilterType(type);
                    setDisplayLimit(60);
                  }}
                >
                  {type === 'Custom' && customFeats.length > 0 ? `Custom (${customFeats.length})` : type}
                </button>
              ))}
            </div>

            {/* Archetype Selector Sub-filter when Archetype tab is active */}
            {filterType === 'Archetype' && (
              <select
                value={selectedArchetypeFilter}
                onChange={(e) => setSelectedArchetypeFilter(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}
              >
                <option value="all">All Archetypes</option>
                {archetypesList.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="pb-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
            {filteredFeats.slice(0, displayLimit).map((feat) => {
              const selected = isFeatSelected(feat);
              const isArch = feat.type === 'Archetype' || feat.name.toLowerCase().includes('dedication');
              const isSkill = feat.type === 'Skill';
              return (
                <div
                  key={feat.id || feat.name}
                  className={`pb-select-card ${selected ? 'selected' : ''}`}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    border: isArch ? '1px solid rgba(56, 189, 248, 0.3)' : isSkill ? '1px solid rgba(16, 185, 129, 0.25)' : undefined
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div className="pb-select-card-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: isArch ? '#38bdf8' : undefined }}>{feat.name}</span>
                        {feat.isCustom && (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--text-gold)', border: '1px solid var(--border-gold)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            Excel Custom
                          </span>
                        )}
                      </div>
                      <span className="pb-pill-tag" style={{ 
                        fontSize: '0.65rem',
                        background: isArch ? 'rgba(56, 189, 248, 0.2)' : isSkill ? 'rgba(16, 185, 129, 0.2)' : undefined,
                        color: isArch ? '#38bdf8' : isSkill ? '#10b981' : undefined
                      }}>
                        {feat.type} {feat.level ? `(Lvl ${feat.level})` : ''}
                      </span>
                    </div>

                    {feat.skill && (
                      <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginBottom: 2 }}>
                        Skill: {feat.skill}
                      </div>
                    )}
                    {feat.prerequisite && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                        Prerequisite: {feat.prerequisite}
                      </div>
                    )}
                    {feat.actions ? (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-gold)', marginBottom: 4 }}>
                        Actions: {feat.actions} {feat.tags?.length > 0 && `[${feat.tags.join(', ')}]`}
                      </div>
                    ) : null}

                    <div className="pb-select-card-desc">{feat.description}</div>
                  </div>

                  <button
                    className={`pb-action-btn ${selected ? 'active' : ''}`}
                    onClick={() => handleToggleFeat(feat)}
                    style={{ marginTop: 10, justifyContent: 'center' }}
                  >
                    {selected ? (
                      <>
                        <Check size={14} />
                        <span>Equipped / Active</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Add to Character</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {filteredFeats.length > displayLimit && (
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                className="pb-btn pb-btn-secondary"
                onClick={() => setDisplayLimit(prev => prev + 60)}
                style={{ fontSize: '0.8rem', padding: '0.4rem 1.25rem' }}
              >
                Show More Feats ({filteredFeats.length - displayLimit} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

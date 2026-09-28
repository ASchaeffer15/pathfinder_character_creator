import React, { useState, useMemo } from 'react';
import { Backpack, Coins, Plus, Trash2, Shield, Sword, Target, Package, Search, Check, Crosshair } from 'lucide-react';
import srdData from '../data/srdRemasterData.json';
import { WEAPONS_DB, ARMOR_DB } from '../data/rulesData';

const ALL_WEAPONS = srdData.weapons || [];

export default function EquipmentTab({ character, onUpdateCharacter }) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemBulk, setNewItemBulk] = useState('1');
  const [weaponSearch, setWeaponSearch] = useState('');
  const [weaponFilter, setWeaponFilter] = useState('All'); // All, Melee, Ranged

  const strMod = character.abilities?.strength?.modifier || 0;
  const dexMod = character.abilities?.dexterity?.modifier || 0;
  const encumberedLimit = 5 + strMod;
  const maxBulkLimit = 10 + strMod;

  // Calculate current bulk
  let totalBulk = 0;
  (character.equipment || []).forEach(item => {
    if (item.bulk === 'L') totalBulk += 0.1;
    else if (!isNaN(parseFloat(item.bulk))) totalBulk += parseFloat(item.bulk);
  });
  totalBulk = Math.round(totalBulk * 10) / 10;

  const bulkPercent = Math.min(100, Math.round((totalBulk / maxBulkLimit) * 100));
  const isEncumbered = totalBulk > encumberedLimit;
  const isOverburdened = totalBulk > maxBulkLimit;

  // Currency handler
  const handleCurrencyChange = (coin, delta) => {
    const current = character.currency?.[coin] || 0;
    const updated = Math.max(0, current + delta);
    onUpdateCharacter({
      currency: {
        ...(character.currency || { cp: 0, sp: 0, gp: 15, pp: 0 }),
        [coin]: updated
      }
    });
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      bulk: newItemBulk,
      quantity: 1,
      type: 'Custom Gear'
    };
    onUpdateCharacter({
      equipment: [...(character.equipment || []), newItem]
    });
    setNewItemName('');
  };

  const handleRemoveItem = (id) => {
    onUpdateCharacter({
      equipment: (character.equipment || []).filter(i => i.id !== id)
    });
  };

  // Recommended weapons tailored for this character
  const recommendedWeapons = useMemo(() => {
    const isDexMartial = ['Rogue', 'Swashbuckler', 'Ranger'].includes(character.class);
    const isCaster = ['Wizard', 'Cleric', 'Druid', 'Bard', 'Sorcerer', 'Witch', 'Magus'].includes(character.class);

    let meleeNames = [];
    let rangedNames = [];

    if (isDexMartial) {
      meleeNames = ['Rapier', 'Shortsword', 'Dagger'];
      rangedNames = ['Composite Shortbow', 'Shortbow', 'Hand Crossbow'];
    } else if (isCaster) {
      meleeNames = ['Staff', 'Dagger', 'Club'];
      rangedNames = ['Crossbow', 'Heavy Crossbow', 'Sling'];
    } else {
      meleeNames = ['Greatsword', 'Greataxe', 'Longsword', 'Warhammer', 'Maul'];
      rangedNames = ['Composite Longbow', 'Heavy Crossbow', 'Longbow', 'Javelin'];
    }

    const recMelee = ALL_WEAPONS.filter(w => meleeNames.some(n => n.toLowerCase() === w.name.toLowerCase()));
    const recRanged = ALL_WEAPONS.filter(w => rangedNames.some(n => n.toLowerCase() === w.name.toLowerCase()));

    return {
      melee: recMelee.slice(0, 4),
      ranged: recRanged.slice(0, 4)
    };
  }, [character.class]);

  // Equip a weapon with level runes
  const handleEquipWeapon = (weapon, slotType) => {
    const lvl = character.level || 1;
    const potency = lvl >= 16 ? 3 : lvl >= 10 ? 2 : lvl >= 2 ? 1 : 0;
    const striking = lvl >= 19 ? 'Major Striking' : lvl >= 12 ? 'Greater Striking' : lvl >= 4 ? 'Striking' : '';
    const diceCount = lvl >= 19 ? 4 : lvl >= 12 ? 3 : lvl >= 4 ? 2 : 1;
    
    let propRune = '';
    let propDmg = '';
    if (lvl >= 16) {
      propRune = 'Flaming Frost Shock';
      propDmg = ' + 1d6 Fire + 1d6 Cold + 1d6 Electricity';
    } else if (lvl >= 12) {
      propRune = 'Flaming Frost';
      propDmg = ' + 1d6 Fire + 1d6 Cold';
    } else if (lvl >= 8) {
      propRune = 'Flaming';
      propDmg = ' + 1d6 Fire';
    }

    const prefix = [potency ? `+${potency}` : '', striking, propRune].filter(Boolean).join(' ');
    const fullName = prefix ? `${prefix} ${weapon.name}` : weapon.name;

    // Weapon specialization damage
    const isLegendary = character.class === 'Fighter' && lvl >= 13;
    const isMaster = (character.class === 'Fighter' && lvl >= 5) || (!['Wizard', 'Cleric', 'Druid', 'Bard', 'Sorcerer'].includes(character.class) && lvl >= 13);
    const specDmg = lvl >= 15 ? (isLegendary ? 8 : isMaster ? 6 : 4) : lvl >= 7 ? (isLegendary ? 4 : isMaster ? 3 : 2) : 0;

    const profBonus = isLegendary ? 8 : isMaster ? 6 : 4; // At least trained/expert
    const isFinesse = weapon.traits?.includes('Finesse');
    const atkAttr = slotType === 'Melee' ? (isFinesse && dexMod > strMod ? dexMod : strMod) : dexMod;
    const atkBonus = lvl + profBonus + atkAttr + potency;

    const baseDie = weapon.damage_die || 8;
    const dmgType = Array.isArray(weapon.damage_type) ? weapon.damage_type[0]?.[0] || 'Physical' : (weapon.damage_type || 'P');
    const dmgAttr = slotType === 'Melee' ? strMod : (weapon.traits?.includes('Propulsive') ? Math.floor(strMod / 2) : 0);
    const formula = `${diceCount}d${baseDie}+${dmgAttr + specDmg} ${dmgType}${propDmg}`;

    const newStrike = {
      name: fullName,
      type: slotType,
      attackBonus: atkBonus,
      damageFormula: formula,
      traits: [...(weapon.traits || []), ...(potency ? ['Magical'] : [])]
    };

    // Replace existing strike of same type or append
    const existingStrikes = [...(character.strikes || [])];
    const existingIdx = existingStrikes.findIndex(s => s.type === slotType);
    if (existingIdx >= 0) {
      existingStrikes[existingIdx] = newStrike;
    } else {
      existingStrikes.unshift(newStrike);
    }

    // Add to equipment inventory if not present
    const existingEq = [...(character.equipment || [])];
    const newEqItem = {
      id: `wpn-${Date.now()}`,
      name: fullName,
      bulk: weapon.bulk || 1,
      quantity: 1,
      type: `${slotType} Weapon`
    };
    
    // Replace old equipped weapon of this type in inventory
    const eqIdx = existingEq.findIndex(e => e.type === `${slotType} Weapon`);
    if (eqIdx >= 0) {
      existingEq[eqIdx] = newEqItem;
    } else {
      existingEq.unshift(newEqItem);
    }

    onUpdateCharacter({
      strikes: existingStrikes,
      equipment: existingEq
    });
  };

  // Filtered weapon catalog
  const filteredWeapons = useMemo(() => {
    return ALL_WEAPONS.filter(w => {
      const matchSearch = w.name.toLowerCase().includes(weaponSearch.toLowerCase()) ||
                          (w.description || '').toLowerCase().includes(weaponSearch.toLowerCase());
      const matchType = weaponFilter === 'All' || w.type.toLowerCase() === weaponFilter.toLowerCase();
      return matchSearch && matchType;
    });
  }, [weaponSearch, weaponFilter]);

  return (
    <div className="pb-equip-container">
      {/* Top Banner: Bulk Bar & Coin Pouch */}
      <div className="pb-grid-2" style={{ marginBottom: '1.25rem' }}>
        {/* Bulk Card */}
        <div className="pb-card">
          <div className="pb-card-header">
            <span className="pb-card-title">
              <Backpack size={18} />
              <span>Bulk Tracker &amp; Encumbrance</span>
            </span>
            <span className="pb-pill-tag" style={{ color: isOverburdened ? 'var(--red-500)' : isEncumbered ? 'var(--gold-500)' : '#10b981' }}>
              {isOverburdened ? 'Overburdened (Clumsy 1, Slowed 10ft)' : isEncumbered ? 'Encumbered (Clumsy 1, -10ft speed)' : 'Unencumbered'}
            </span>
          </div>
          <div className="pb-card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Total Bulk: <strong>{totalBulk}</strong></span>
              <span>Encumbered: <strong>{encumberedLimit}</strong> | Max: <strong>{maxBulkLimit}</strong></span>
            </div>
            <div className="bulk-bar-container">
              <div 
                className="bulk-bar-fill" 
                style={{ 
                  width: `${bulkPercent}%`,
                  background: isOverburdened ? 'var(--red-500)' : isEncumbered ? 'var(--gold-500)' : '#10b981'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Currency Pouch */}
        <div className="pb-card">
          <div className="pb-card-header">
            <span className="pb-card-title">
              <Coins size={18} />
              <span>Coin Pouch &amp; Wealth</span>
            </span>
          </div>
          <div className="pb-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {[
              { id: 'cp', label: 'Copper (CP)', color: '#b45309' },
              { id: 'sp', label: 'Silver (SP)', color: '#94a3b8' },
              { id: 'gp', label: 'Gold (GP)', color: '#f59e0b' },
              { id: 'pp', label: 'Platinum (PP)', color: '#38bdf8' }
            ].map(c => {
              const amount = character.currency?.[c.id] || 0;
              return (
                <div key={c.id} style={{ background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)' }}>{amount}</div>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
                    <button className="hp-btn" onClick={() => handleCurrencyChange(c.id, -1)}>-1</button>
                    <button className="hp-btn" onClick={() => handleCurrencyChange(c.id, 1)}>+1</button>
                    <button className="hp-btn" onClick={() => handleCurrencyChange(c.id, 10)}>+10</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommended Armament Card */}
      <div className="pb-card" style={{ marginBottom: '1.25rem', borderLeft: '3px solid var(--gold-500)' }}>
        <div className="pb-card-header">
          <span className="pb-card-title">
            <Sword size={18} style={{ color: 'var(--text-gold)' }} />
            <span>Recommended Armament: Melee &amp; Ranged Weapons</span>
          </span>
          <span className="pb-pill-tag" style={{ color: 'var(--text-gold)' }}>
            Auto-Runed for Level {character.level}
          </span>
        </div>
        <div className="pb-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Recommended Melee */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sword size={14} />
                <span>Primary Melee Options</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recommendedWeapons.melee.map(w => (
                  <div key={w.id} style={{ background: 'var(--bg-primary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {w.damage} &bull; {w.category} &bull; Hands: {w.hands}
                      </div>
                    </div>
                    <button 
                      className="pb-action-btn"
                      onClick={() => handleEquipWeapon(w, 'Melee')}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                    >
                      Equip Melee
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Ranged */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--blue-500)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={14} />
                <span>Primary Ranged Options</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recommendedWeapons.ranged.map(w => (
                  <div key={w.id} style={{ background: 'var(--bg-primary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {w.damage} &bull; {w.category} &bull; Bulk: {w.bulk}
                      </div>
                    </div>
                    <button 
                      className="pb-action-btn"
                      onClick={() => handleEquipWeapon(w, 'Ranged')}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                    >
                      Equip Ranged
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment List & Weapon Catalog */}
      <div className="pb-grid-2">
        {/* Inventory */}
        <div className="pb-card">
          <div className="pb-card-header">
            <span className="pb-card-title">
              <Package size={18} />
              <span>Inventory &amp; Possessions ({(character.equipment || []).length})</span>
            </span>
          </div>
          <div className="pb-card-body" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(character.equipment || []).map((item) => (
                <div key={item.id} style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Bulk: {item.bulk} {item.type ? `| ${item.type}` : ''} {item.quantity > 1 ? `(Qty: ${item.quantity})` : ''}
                    </div>
                  </div>
                  <button onClick={() => handleRemoveItem(item.id)} style={{ color: 'var(--red-500)', padding: 4 }} title="Remove item">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Custom Gear Form */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-gold)' }}>+ Add Custom Gear</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="e.g. Invisibility Potion, Rope" 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                />
                <select value={newItemBulk} onChange={(e) => setNewItemBulk(e.target.value)} style={{ fontSize: '0.8rem', width: '90px' }}>
                  <option value="0">— (0)</option>
                  <option value="L">L</option>
                  <option value="1">1 Bulk</option>
                  <option value="2">2 Bulk</option>
                </select>
                <button 
                  className="pb-action-btn"
                  onClick={handleAddItem}
                  style={{ background: 'var(--gold-600)', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem' }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Weapons Arsenal Browser */}
        <div className="pb-card">
          <div className="pb-card-header" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="pb-card-title">
                <Crosshair size={18} />
                <span>Weapons Arsenal ({filteredWeapons.length})</span>
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['All', 'Melee', 'Ranged'].map(t => (
                  <button
                    key={t}
                    className={`pb-action-btn ${weaponFilter === t ? 'active' : ''}`}
                    onClick={() => setWeaponFilter(t)}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <input 
              type="text"
              placeholder="Search weapons by name or trait..."
              value={weaponSearch}
              onChange={(e) => setWeaponSearch(e.target.value)}
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
            />
          </div>

          <div className="pb-card-body" style={{ maxHeight: '550px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredWeapons.slice(0, 40).map((w) => (
                <div key={w.id} style={{ background: 'var(--bg-primary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '0.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      {w.name}
                      <span className="pb-pill-tag" style={{ marginLeft: 6, fontSize: '0.65rem' }}>
                        {w.type} &bull; {w.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-gold)', marginTop: 2 }}>
                      Damage: {w.damage} | Bulk: {w.bulk} | Hands: {w.hands}
                    </div>
                    {w.traits?.length > 0 && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Traits: {w.traits.join(', ')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button 
                      className="pb-action-btn"
                      onClick={() => handleEquipWeapon(w, w.type === 'Ranged' ? 'Ranged' : 'Melee')}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                    >
                      Equip
                    </button>
                  </div>
                </div>
              ))}
              {filteredWeapons.length > 40 && (
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
                  Showing top 40 of {filteredWeapons.length} weapons. Use search to find specific items.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

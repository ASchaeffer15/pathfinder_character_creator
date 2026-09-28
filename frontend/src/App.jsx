import React, { useState } from 'react';
import Header from './components/Header';
import TabsNav from './components/TabsNav';
import CharacterSheet from './components/CharacterSheet';
import BuildTab from './components/BuildTab';
import FeatsTab from './components/FeatsTab';
import SpellsTab from './components/SpellsTab';
import EquipmentTab from './components/EquipmentTab';
import LoreTab from './components/LoreTab';
import AIStudioTab from './components/AIStudioTab';
import TacticalAdvisorTab from './components/TacticalAdvisorTab';
import AIChatDrawer from './components/AIChatDrawer';
import DiceModal from './components/DiceModal';
import Footer from './components/Footer';

const initialCharacter = {
  name: "Valeros of Absalom",
  level: 1,
  ancestry: "Human",
  heritage: "Versatile Heritage",
  background: "Warrior",
  class: "Fighter",
  speed: 25,
  heroPoints: 1,
  currentHp: 20,
  maxHp: 20,
  tempHp: 0,
  ac: 18,
  armorName: "Chain Mail",
  armorBonus: 4,
  dexCap: 1,
  shieldRaised: false,
  perception: 7,
  perceptionProf: "Expert",
  senses: "Normal Vision",
  saves: {
    fortitude: 7,
    reflex: 7,
    will: 4
  },
  savesProf: {
    fortitude: "Expert",
    reflex: "Expert",
    will: "Trained"
  },
  abilities: {
    strength: { score: 18, modifier: 4 },
    dexterity: { score: 14, modifier: 2 },
    constitution: { score: 14, modifier: 2 },
    intelligence: { score: 10, modifier: 0 },
    wisdom: { score: 12, modifier: 1 },
    charisma: { score: 10, modifier: 0 }
  },
  freeBoosts: ['strength', 'dexterity', 'constitution', 'wisdom'],
  skillsProf: {
    athletics: 'T',
    'warfare-lore': 'T',
    acrobatics: 'T',
    intimidation: 'T'
  },
  strikes: [
    {
      name: "Longsword",
      attackBonus: 9,
      damageFormula: "1d8+4 S",
      traits: ["Versatile P"]
    },
    {
      name: "Composite Shortbow",
      attackBonus: 7,
      damageFormula: "1d6+2 P",
      traits: ["Deadly d10", "Propulsive"]
    },
    {
      name: "Fist (Unarmed)",
      attackBonus: 9,
      damageFormula: "1d4+4 B",
      traits: ["Agile", "Finesse", "Nonlethal"]
    }
  ],
  feats: [
    {
      id: "sudden-charge",
      name: "Sudden Charge",
      type: "Class",
      level: 1,
      actions: 2,
      tags: ["Flourish", "Open"],
      description: "Stride twice and make a melee Strike."
    },
    {
      id: "natural-ambition",
      name: "Natural Ambition",
      type: "Ancestry",
      level: 1,
      description: "Gain a 1st-level class feat."
    },
    {
      id: "intimidating-glare",
      name: "Intimidating Glare",
      type: "Skill",
      level: 1,
      description: "Demoralize with visual cues rather than speech."
    },
    {
      id: "shield-block",
      name: "Shield Block",
      type: "General",
      level: 1,
      description: "Reduce damage taken by shield hardness."
    }
  ],
  spells: [],
  equipment: [
    { id: "eq-1", name: "Longsword", bulk: 1, quantity: 1 },
    { id: "eq-2", name: "Steel Shield (Hardness 5, HP 20)", bulk: 1, quantity: 1 },
    { id: "eq-3", name: "Chain Mail", bulk: 2, quantity: 1 },
    { id: "eq-4", name: "Adventurer's Pack", bulk: 1, quantity: 1 },
    { id: "eq-5", name: "Lesser Healing Potion", bulk: "L", quantity: 2 }
  ],
  currency: { cp: 0, sp: 6, gp: 14, pp: 0 },
  backstory: "Valeros was born in the bustling streets of Absalom, the City at the Center of the World. Drawn to military discipline and mercenary adventures, he forged himself with cold steel and boundless courage.",
  deity: "Cayden Cailean",
  edicts: "Fight for the underdog, raise a toast with allies, never yield to tyrants.",
  anathema: "Break a solemn sworn vow, waste fine ale, surrender without a struggle.",
  campaignNotes: "Encountered goblin raiders near Otari. Party consists of Valeros, Ezren, and Kyra."
};

export default function App() {
  const [character, setCharacter] = useState(initialCharacter);
  const [activeTab, setActiveTab] = useState('build');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(true);
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [lastDiceBanner, setLastDiceBanner] = useState(null);

  const handleUpdateCharacter = (updates) => {
    setCharacter(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleRollDice = (title, formula, bonus = 0) => {
    // Parse standard formulas like 1d20+7 or 1d8+4
    let result = 0;
    let rolls = [];
    if (formula.includes('d20')) {
      const r = Math.floor(Math.random() * 20) + 1;
      rolls.push(r);
      result = r + bonus;
    } else if (formula.includes('d8')) {
      const r = Math.floor(Math.random() * 8) + 1;
      rolls.push(r);
      result = r + (parseInt(formula.split('+')[1]) || 0);
    } else if (formula.includes('d6')) {
      const r = Math.floor(Math.random() * 6) + 1;
      rolls.push(r);
      result = r + (parseInt(formula.split('+')[1]) || 0);
    } else if (formula.includes('d4')) {
      const r = Math.floor(Math.random() * 4) + 1;
      rolls.push(r);
      result = r + (parseInt(formula.split('+')[1]) || 0);
    } else {
      const r = Math.floor(Math.random() * 20) + 1;
      rolls.push(r);
      result = r + bonus;
    }

    const isNat20 = rolls.includes(20);
    const isNat1 = rolls.includes(1);

    setLastDiceBanner({
      title,
      formula,
      rolls,
      result,
      isNat20,
      isNat1,
      id: Date.now()
    });

    // Auto dismiss banner after 5 seconds
    setTimeout(() => {
      setLastDiceBanner(prev => (prev?.id === lastDiceBanner?.id ? null : prev));
    }, 5000);
  };

  const handleExportJson = () => {
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(character, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", jsonStr);
    dlAnchorElem.setAttribute("download", `${character.name.replace(/\s+/g, '_')}_PF2e.json`);
    dlAnchorElem.click();
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setCharacter(parsed);
        alert(`Successfully imported "${parsed.name}"!`);
      } catch (err) {
        alert("Failed to parse JSON file. Please ensure it is a valid Pathfinder character export.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-root">
      {/* Top Header & Stats */}
      <Header
        character={character}
        onUpdateCharacter={handleUpdateCharacter}
        onRollDice={handleRollDice}
        onOpenDiceModal={() => setDiceModalOpen(true)}
        onToggleAiDrawer={() => setAiDrawerOpen(!aiDrawerOpen)}
        aiDrawerOpen={aiDrawerOpen}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
      />

      {/* Main Tab Navigation */}
      <TabsNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Live Dice Roll Banner Notification */}
      {lastDiceBanner && (
        <div style={{
          background: lastDiceBanner.isNat20 ? 'linear-gradient(90deg, #b45309 0%, #d97706 100%)' : lastDiceBanner.isNat1 ? 'linear-gradient(90deg, #991b1b 0%, #dc2626 100%)' : 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
          color: '#fff',
          padding: '0.45rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-md)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <div>
            <strong>🎲 {lastDiceBanner.title} ({lastDiceBanner.formula}):</strong>
            <span style={{ marginLeft: 8 }}>
              Roll [{lastDiceBanner.rolls.join(', ')}] = <strong style={{ fontSize: '1.1rem' }}>{lastDiceBanner.result}</strong>
            </span>
            {lastDiceBanner.isNat20 && <span style={{ marginLeft: 10, background: '#d97706', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 800 }}>NAT 20! CRITICAL SUCCESS!</span>}
            {lastDiceBanner.isNat1 && <span style={{ marginLeft: 10, background: '#ef4444', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 800 }}>NAT 1! CRITICAL FAILURE!</span>}
          </div>
          <button onClick={() => setLastDiceBanner(null)} style={{ color: '#fff', opacity: 0.8 }}>✕</button>
        </div>
      )}

      {/* App Body: Main Screen + AI Chat Drawer */}
      <div className="pb-app-container">
        <main className="pb-main-content">
          {activeTab === 'sheet' && (
            <CharacterSheet 
              character={character} 
              onUpdateCharacter={handleUpdateCharacter}
              onRollDice={handleRollDice} 
            />
          )}

          {activeTab === 'tactics' && (
            <TacticalAdvisorTab 
              character={character} 
              onUpdateCharacter={handleUpdateCharacter}
              onRollDice={handleRollDice} 
            />
          )}

          {activeTab === 'build' && (
            <BuildTab 
              character={character} 
              onUpdateCharacter={handleUpdateCharacter} 
            />
          )}

          {activeTab === 'feats' && (
            <FeatsTab 
              character={character} 
              onUpdateCharacter={handleUpdateCharacter} 
            />
          )}

          {activeTab === 'spells' && (
            <SpellsTab 
              character={character} 
              onUpdateCharacter={handleUpdateCharacter}
              onRollDice={handleRollDice} 
            />
          )}

          {activeTab === 'equipment' && (
            <EquipmentTab 
              character={character} 
              onUpdateCharacter={handleUpdateCharacter} 
            />
          )}

          {activeTab === 'lore' && (
            <LoreTab 
              character={character} 
              onUpdateCharacter={handleUpdateCharacter} 
            />
          )}

          {activeTab === 'ai-studio' && (
            <AIStudioTab 
              character={character} 
              onUpdateCharacter={handleUpdateCharacter}
            />
          )}

          {/* Copyright Statement Footer */}
          <Footer />
        </main>

        {/* Pathfinder AI Companion Drawer */}
        <AIChatDrawer
          isOpen={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          character={character}
          onUpdateCharacter={handleUpdateCharacter}
          onRollDice={handleRollDice}
          onSelectTab={setActiveTab}
        />
      </div>

      {/* Dice Roller Tray Modal */}
      <DiceModal
        isOpen={diceModalOpen}
        onClose={() => setDiceModalOpen(false)}
        onRollDice={handleRollDice}
        lastRoll={lastDiceBanner}
      />
    </div>
  );
}

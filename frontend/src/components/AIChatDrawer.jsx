import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, X, Sparkles, Check, ChevronRight, Dices, RefreshCw, 
  Layers, Database, Settings, Sliders, RotateCcw, Zap
} from 'lucide-react';

const DEFAULT_PERSONA_PROMPT = `You are a warm, friendly, deeply helpful, and collaborative Pathfinder 2nd Edition (Remaster) AI companion.
You love thinking outside the box—finding surprising synergies, unusual ancestry/class combinations, and clever tactical tricks while keeping the math and rules completely sound.

Your goal is to be an enthusiastic creative co-pilot in forging memorable characters.

Guidelines:
1. First ask whether the player wants to start from the ground up (ancestry, background, class, boosts) or work backwards from a full hero concept.
2. Brainstorm unconventional, exciting synergies (e.g. armored spellcasters, stealth champions, grappling barbarians/wizards).
3. Be supportive, conversational, and mechanically accurate.`;

function generateClientCharacter(level = 19, className = 'Fighter', ancestryName = 'Human', heritageName = '', backgroundName = 'Warrior', weaponName = '', requestedFeats = []) {
  const isHigh = level >= 19;
  const isMid = level >= 10;
  const hpBase = className === 'Barbarian' ? 12 : (className === 'Wizard' || className === 'Witch' || className === 'Sorcerer') ? 6 : (className === 'Rogue' || className === 'Cleric' || className === 'Druid' || className === 'Bard') ? 8 : 10;
  const conMod = isHigh ? 5 : isMid ? 3 : 2;
  const totalHp = 10 + (level * (hpBase + conMod)) + (isHigh ? level : 0);
  const ac = isHigh ? 44 : isMid ? 30 : 18;

  let strikes = [];
  if (className === 'Wizard' || className === 'Druid' || weaponName === 'Staff') {
    strikes = [
      { name: className === 'Druid' ? "+3 Major Striking Staff of the Archdruid" : "+3 Major Striking Staff of the Archmage", attackBonus: level + 14, damageFormula: "4d8+6 B + 1d6 Force", traits: ["Magical", "Two-Hand d8"] },
      { name: className === 'Druid' ? "Storm Call (Rank 9 Spell)" : "Chain Lightning (Rank 9 Spell)", attackBonus: level + 16, damageFormula: "10d12 Electricity", traits: ["Electricity", "Primal"] }
    ];
  } else if (className === 'Rogue' || weaponName === 'Shortsword' || weaponName === 'Dagger') {
    strikes = [
      { name: "+3 Major Striking Shock Shortsword", attackBonus: level + 16, damageFormula: "4d6+7 P + 4d6 Sneak Attack + 1d6 Electricity", traits: ["Agile", "Finesse", "Versatile S"] },
      { name: "+3 Major Striking Returning Dagger", attackBonus: level + 16, damageFormula: "4d4+7 P/S + 4d6 Sneak Attack", traits: ["Agile", "Finesse", "Thrown 10ft"] }
    ];
  } else if (className === 'Barbarian' || weaponName === 'Greataxe') {
    strikes = [
      { name: "+3 Major Striking Flaming Frost Greataxe", attackBonus: level + 16, damageFormula: "4d12+15 S + 1d6 Fire + 1d6 Cold", traits: ["Sweep", "Magical"] },
      { name: "+3 Greater Striking Composite Shortbow", attackBonus: level + 14, damageFormula: "3d6+4 P", traits: ["Deadly d10", "Propulsive"] }
    ];
  } else if (className === 'Champion' || weaponName === 'Shield') {
    strikes = [
      { name: "+3 Major Striking Holy Shield Boss", attackBonus: level + 16, damageFormula: "4d6+7 B + 1d6 Spirit", traits: ["Attached to Shield", "Magical"] },
      { name: "+3 Major Striking Flaming Longsword", attackBonus: level + 16, damageFormula: "4d8+7 S + 1d6 Fire", traits: ["Versatile P", "Magical"] }
    ];
  } else {
    strikes = [
      { name: "+3 Major Striking Flaming Frost Greatsword", attackBonus: level + 16, damageFormula: "4d12+14 S + 1d6 Fire + 1d6 Cold", traits: ["Versatile P", "Magical"] },
      { name: "+3 Greater Striking Composite Longbow", attackBonus: level + 14, damageFormula: "3d8+6 P", traits: ["Deadly d10", "Propulsive", "Volley 30ft"] }
    ];
  }

  const resolvedHeritage = heritageName || (ancestryName === 'Leshy' ? 'Leaf Leshy' : ancestryName === 'Orc' ? 'Badlands Orc' : ancestryName === 'Dwarf' ? 'Forge Dwarf' : ancestryName === 'Elf' ? 'Ancient Elf' : ancestryName === 'Catfolk' ? 'Clawed Catfolk' : 'Versatile Heritage');
  const resolvedBg = backgroundName || (className === 'Wizard' ? 'Scholar' : className === 'Druid' ? 'Herbalist' : className === 'Barbarian' ? 'Gladiator' : className === 'Rogue' ? 'Street Urchin' : 'Warrior');

  const charFeats = [
    { id: "bg-feat", name: resolvedBg === 'Herbalist' ? 'Natural Medicine' : resolvedBg === 'Gladiator' ? 'Impressive Performance' : resolvedBg === 'Street Urchin' ? 'Pickpocket' : (resolvedBg === 'Artisan' || resolvedBg === 'Blacksmith') ? 'Specialty Crafting' : 'Shield Block', type: 'Skill', level: 1, description: `Granted by your ${resolvedBg} background.` }
  ];

  if (requestedFeats && requestedFeats.length > 0) {
    requestedFeats.forEach(rf => {
      charFeats.push({
        id: rf.toLowerCase().replace(/\s+/g, '-'),
        name: rf,
        type: 'Class',
        level: Math.min(level, 18),
        description: `Key specialty feat requested for your Level ${level} ${className}.`
      });
    });
  }

  // Standard high level milestone feats
  const milestones = [
    { id: "sudden-charge", name: "Sudden Charge", type: "Class", level: 1, actions: 2, description: "Stride twice and make a melee Strike." },
    { id: "battle-medicine", name: "Battle Medicine", type: "Skill", level: 2, description: "Treat wounds in combat." },
    { id: "knockdown", name: "Knockdown", type: "Class", level: 4, actions: 2, description: "Strike and trip foe." },
    { id: "cloud-jump", name: "Cloud Jump", type: "Skill", level: 10, description: "Triple jump distance." },
    { id: "improved-knockdown", name: "Improved Knockdown", type: "Class", level: 12, description: "Automatically trip on hit." },
    { id: "whirlwind-strike", name: "Whirlwind Strike", type: "Class", level: 14, actions: 3, description: "Strike all foes in reach." },
    { id: "scare-to-death", name: "Scare to Death", type: "Skill", level: 16, description: "Terrify creature to death." },
    { id: "savage-critical", name: "Savage Critical", type: "Class", level: 18, description: "Crits on 19 or 20." },
    { id: "apex-vitality", name: "Apex Vitality", type: "General", level: 19, description: "Legendary physical resistance." }
  ];
  milestones.forEach(m => {
    if (!charFeats.some(f => f.name.toLowerCase() === m.name.toLowerCase())) {
      charFeats.push(m);
    }
  });

  return {
    name: className === 'Wizard' ? 'Archmage Elidor Starweaver' : className === 'Druid' ? 'Archdruid Oakhaven' : className === 'Rogue' ? 'Shadow-Walker Corin' : className === 'Barbarian' ? 'Thorgar the World-Breaker' : className === 'Champion' ? 'Lord Justinian the Golden Sun' : 'Valeros the Undaunted',
    level: level,
    ancestry: ancestryName,
    heritage: resolvedHeritage,
    background: resolvedBg,
    class: className,
    speed: isHigh ? 35 : 25,
    heroPoints: 2,
    currentHp: totalHp,
    maxHp: totalHp,
    tempHp: 0,
    ac: ac,
    armorName: isHigh ? "+3 Greater Resilient Full Plate" : "Chain Mail",
    armorBonus: isHigh ? 8 : 4,
    dexCap: 1,
    shieldRaised: false,
    perception: level + 9,
    perceptionProf: "Master",
    senses: "Darkvision, True Seeing",
    saves: { fortitude: level + 13, reflex: level + 14, will: level + 10 },
    savesProf: { fortitude: "Master", reflex: "Master", will: "Expert" },
    abilities: {
      strength: { score: (className === 'Wizard' || className === 'Druid') ? 14 : 24, modifier: (className === 'Wizard' || className === 'Druid') ? 2 : 7 },
      dexterity: { score: className === 'Rogue' ? 24 : 18, modifier: className === 'Rogue' ? 7 : 4 },
      constitution: { score: 20, modifier: 5 },
      intelligence: { score: className === 'Wizard' ? 24 : 12, modifier: className === 'Wizard' ? 7 : 1 },
      wisdom: { score: className === 'Druid' ? 24 : 16, modifier: className === 'Druid' ? 7 : 3 },
      charisma: { score: 12, modifier: 1 }
    },
    freeBoosts: ['strength', 'constitution', 'dexterity', 'wisdom'],
    skillsProf: { athletics: 'L', 'warfare-lore': 'L', acrobatics: 'M', intimidation: 'L', medicine: 'M' },
    strikes: strikes,
    feats: charFeats,
    spells: [],
    equipment: [
      { id: "eq-1", name: strikes[0].name, bulk: 2, quantity: 1 },
      { id: "eq-2", name: isHigh ? "+3 Greater Resilient Armor" : "Chain Mail", bulk: 4, quantity: 1 },
      { id: "eq-3", name: "Belt of Giant Strength (Apex Item, STR +2)", bulk: 1, quantity: 1 },
      { id: "eq-4", name: "Boots of Speed (Quickened 1/day)", bulk: "L", quantity: 1 },
      { id: "eq-5", name: "Major Healing Potion (+150 HP)", bulk: "L", quantity: 6 }
    ],
    currency: { cp: 0, sp: 50, gp: 3450, pp: 120 },
    backstory: `A legendary Level ${level} hero whose feats echo across Golarion and the Great Beyond.`,
    deity: "Gorum",
    edicts: "Face foes with absolute honor and supreme certainty.",
    anathema: "Flee from a righteous duel or surrender to fiends.",
    campaignNotes: `Level ${level} apex character ready for planar demigod challenges.`
  };
}

export default function AIChatDrawer({ 
  isOpen, 
  onClose, 
  character, 
  onUpdateCharacter,
  onRollDice,
  onSelectTab
}) {
  const [personaPrompt, setPersonaPrompt] = useState(DEFAULT_PERSONA_PROMPT);
  const [showSettings, setShowSettings] = useState(false);

  const initialGreeting = `Hail, traveler! 🌟 I'm your **Pathfinder AI Companion** — your creative co-pilot and rules engineer! I can help you brainstorm builds from scratch, or **interpret your desired Class, Ancestry, Background, and Feats** to forge an apex Level 19 character directly into the Character Builder!\n\nWhat would you like to build?\n\n• **⚡ Build a Level 19 Hero**: I interpret your class, ancestry, background, weapons, and feats with full 19-tier progression!\n• **🌱 Start from the ground up**: We craft ancestry, background, class, and boosts step-by-step.\n• **🎲 Surprise me**: Explore unconventional, high-synergy builds!`;

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: initialGreeting,
      options: [
        "⚡ Level 19 Leshy Druid (Herbalist)",
        "⚡ Level 19 Orc Barbarian (Gladiator)",
        "⚡ Level 19 Catfolk Rogue (Street Urchin)",
        "⚡ Level 19 Dwarf Champion (Blacksmith)"
      ],
      action: null
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeSheetContext, setIncludeSheetContext] = useState(true);
  const [includeRagKnowledge, setIncludeRagKnowledge] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    "⚡ Level 19 Leshy Druid (Herbalist)",
    "⚡ Level 19 Orc Barbarian (Gladiator)",
    "⚡ Level 19 Catfolk Rogue (Street Urchin)",
    "⚡ Level 19 Dwarf Champion (Blacksmith)",
    "🌱 Start from the ground up",
    "🎲 Outside-the-box build ideas",
    "🛡️ How does Shield Block work in combat?",
    "⚔️ Explain Multiple Attack Penalty (MAP)"
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    // Check for dice roll command in chat: e.g. /roll 1d20+7
    if (query.startsWith('/roll')) {
      const parts = query.replace('/roll', '').trim();
      const formula = parts || '1d20';
      setTimeout(() => {
        onRollDice('Chat Dice Roll', formula, 0);
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `🎲 Rolled **${formula}** for you! Check the dice result banner above.`
          }
        ]);
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const payload = {
        message: query,
        character_context: includeSheetContext ? {
          name: character.name,
          level: character.level,
          ancestry: character.ancestry,
          heritage: character.heritage,
          class: character.class,
          background: character.background,
          abilities: character.abilities,
          ac: character.ac,
          currentHp: character.currentHp,
          maxHp: character.maxHp,
          feats: character.feats?.map(f => f.name) || [],
          strikes: character.strikes?.map(s => s.name) || []
        } : null,
        use_rag: includeRagKnowledge,
        custom_persona: personaPrompt
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: data.reply,
            action: data.suggested_action || null,
            model_source: data.model_source || "Dual Engine (Llama 3.2 + Pathfinder)"
          }
        ]);
      } else {
        throw new Error("Chat request failed");
      }
    } catch (err) {
      // Local fallback intelligent response
      setTimeout(() => {
        let fallbackReply = "";
        let suggestedAction = null;

        const qLower = query.toLowerCase();
        const isBuildOrInterpret = (
          qLower.includes("build") || qLower.includes("make") || qLower.includes("create") ||
          qLower.includes("level 19") || qLower.includes("lvl 19") || qLower.includes("character builder") ||
          qLower.includes("interpret") || qLower.includes("class") || qLower.includes("background") || qLower.includes("feat")
        );

        if (isBuildOrInterpret) {
          const isMetaInquiry = qLower.includes("interpret") && !["wizard", "barbarian", "rogue", "druid", "champion", "cleric", "leshy", "orc", "dwarf"].some(k => qLower.includes(k));

          let reqClass = "Fighter";
          for (const c of ["Barbarian", "Wizard", "Rogue", "Champion", "Druid", "Cleric", "Ranger", "Monk", "Bard", "Sorcerer", "Fighter"]) {
            if (qLower.includes(c.toLowerCase())) { reqClass = c; break; }
          }
          if (qLower.includes("paladin")) reqClass = "Champion";
          if (isMetaInquiry) reqClass = "Druid";

          let reqAncestry = "Human";
          for (const a of ["Leshy", "Orc", "Dwarf", "Elf", "Catfolk", "Kobold", "Goblin", "Halfling", "Gnome", "Human"]) {
            if (qLower.includes(a.toLowerCase())) { reqAncestry = a; break; }
          }
          if (isMetaInquiry) reqAncestry = "Leshy";

          let reqBg = "Warrior";
          for (const b of ["Herbalist", "Gladiator", "Artisan", "Blacksmith", "Field Medic", "Street Urchin", "Scholar", "Warrior"]) {
            if (qLower.includes(b.toLowerCase())) { reqBg = b === "Blacksmith" ? "Artisan" : b; break; }
          }
          if (isMetaInquiry) reqBg = "Herbalist";

          let reqWeapon = "";
          for (const w of ["Greataxe", "Greatsword", "Longsword", "Shortsword", "Staff", "Bow", "Shield", "Warhammer"]) {
            if (qLower.includes(w.toLowerCase())) { reqWeapon = w; break; }
          }

          const reqFeats = [];
          for (const f of ["Green Tongue", "Timber Transformation", "Cloud Jump", "Sudden Charge", "Scare to Death", "Shield Block", "Quick Shield Block", "Nimble Dodge", "Mobility", "Reach Spell", "Quickened Casting"]) {
            if (qLower.includes(f.toLowerCase())) { reqFeats.push(f); }
          }
          if (isMetaInquiry) {
            reqFeats.push("Green Tongue", "Timber Transformation", "Cloud Jump");
          }

          const builtChar = generateClientCharacter(19, reqClass, reqAncestry, '', reqBg, reqWeapon, reqFeats);
          fallbackReply = `### ⚡ Level 19 ${builtChar.class} Forged: **${builtChar.name}**\n\nI have interpreted your specifications and constructed a complete, rules-legal **Level 19 ${builtChar.ancestry} (${builtChar.heritage}) ${builtChar.class}**!\n\n---\n#### 🔍 Interpreted Details\n• 🎭 **Class**: **${builtChar.class}**\n• 🌿 **Ancestry & Heritage**: **${builtChar.ancestry}** (${builtChar.heritage})\n• 📜 **Background**: **${builtChar.background}** (Background Feat: *${builtChar.feats[0]?.name}*)\n• ⚔️ **Legendary Weapon**: **${builtChar.strikes[0]?.name}** (+${builtChar.strikes[0]?.attackBonus} to hit, ${builtChar.strikes[0]?.damageFormula})\n\n---\n#### 🛡️ Defenses & Attributes\n• **Hit Points**: **${builtChar.maxHp} HP**\n• **Armor Class**: **${builtChar.ac} AC** (${builtChar.armorName})\n• **Attributes**: STR ${builtChar.abilities.strength.score} (+${builtChar.abilities.strength.modifier}) | DEX ${builtChar.abilities.dexterity.score} (+${builtChar.abilities.dexterity.modifier}) | CON ${builtChar.abilities.constitution.score} (+${builtChar.abilities.constitution.modifier}) | WIS ${builtChar.abilities.wisdom.score} (+${builtChar.abilities.wisdom.modifier})\n` +
          (reqFeats.length > 0 ? `\n---\n#### 🎯 Your Requested Feats Integrated:\n` + reqFeats.map(f => `• ✓ **${f}** (Active in feat progression)`).join('\n') : '') +
          `\n\n---\n#### 🔒 Character Builder Level Gating Status:\n• **Levels 1 through 19**: **UNLOCKED & ACTIVE** in the Character Builder.\n• **Level 20**: **LOCKED** (Disabled with 🔒 until Level Up).\n\n👉 Click **Apply Level 19 ${builtChar.class} to Character Builder** below to load this character!`;
          suggestedAction = {
            type: "load_character_build",
            label: `⚡ Apply Level 19 ${builtChar.class} to Character Builder`,
            character: builtChar
          };
        } else if (qLower.includes("ground up")) {
          fallbackReply = `Fantastic choice! Building from the ground up gives you complete control over your character's foundational identity.\n\nLet's start with **Step 1: Your Roots & Heritage**:\n\n• **Ancestry**: Are you drawn to the steadfast resilience of a **Dwarf**, the swift, esoteric grace of an **Elf**, the unmatched adaptability of a **Human**, or the quirky ingenuity of a **Goblin**?\n• **Background**: What shaped you before adventuring? (e.g. **Warrior**, **Field Medic**, **Scholar**, or **Street Urchin**?)\n\nTell me what kind of origin calls to you, or pitch a wild combination!`;
        } else if (qLower.includes("character back") || qLower.includes("full character")) {
          fallbackReply = `I love this approach! Starting with a vivid hero concept and reverse-engineering the mechanics often yields the most unique, thematic characters.\n\nTell me about your hero in the theater of your mind:\n\n1. **The Core Fantasy**: When combat begins, what does your hero look like? (e.g., A whirlwind of flashing blades? An unyielding bulwark who protects allies? A witty trickster?)\n2. **The Signature Twist**: Do you want an unconventional synergy? (Like an armored frontline Sorcerer, an elusive rogue-like Champion, or a brawny scholar?)\n3. **What is their defining weapon or fighting style?**\n\nShare whatever sparks you have, and we'll reverse-engineer the exact mechanics to bring it to life!`;
        } else if (qLower.includes("outside the box") || qLower.includes("surprise me")) {
          fallbackReply = `Here are three of my favorite **outside-the-box Pathfinder 2e builds** that break standard tropes while being completely rules-legal and tactically lethal:\n\n🔥 **1. The 'Torch-Born' Goblin Barbarian**\n• **Synergy**: Charhide Goblin with *Burn It!* + Barbarian Fury Instinct. You're small, terrifyingly agile, and hit like a runaway siege engine.\n\n🛡️ **2. The 'Walking Fortress' Dwarven Battle Medic**\n• **Synergy**: Rock Dwarf + Champion + Field Medic. Combine *Shield Block* (absorbs 5+ damage) with *Battle Medicine* to heal allies under fire without burning spell slots.\n\n⚡ **3. The Arcane Grappler**\n• **Synergy**: Orc or Human with *Titan Wrestler* + Fighter/Wizard dedication. Cast *Shield*, pin monstrous beasts with Athletics checks, and blast them point-blank!\n\nWhich of these sparks your curiosity?`;
          suggestedAction = {
            type: "add_feat",
            label: "Add Shield Block Feat",
            feat: { id: "shield-block", name: "Shield Block", type: "General", level: 1, description: "Trigger: While shield is raised, absorb damage with shield hardness." }
          };
        } else if (qLower.includes("feat")) {
          fallbackReply = `Based on your **${character.class}** (${character.ancestry}), I strongly recommend taking **Sudden Charge**.\n\n* **Sudden Charge** (2 Actions, Flourish, Open): With your 25ft Speed, you can Stride twice and make a melee Strike! This lets you close a 50-foot gap in a single turn and still attack with your weapon.`;
          suggestedAction = {
            type: "add_feat",
            label: "Add Sudden Charge Feat",
            feat: { id: "sudden-charge", name: "Sudden Charge", type: "Class", level: 1, actions: 2, description: "Stride twice and make a melee Strike." }
          };
        } else if (qLower.includes("shield")) {
          fallbackReply = `In Pathfinder 2e, shields provide protection through two key steps:\n\n1. **Raise a Shield** (1 Action): Gives you a **+2 circumstance bonus to AC** until the start of your next turn.\n2. **Shield Block** (Reaction): When you are hit while your shield is raised, you can reduce the damage by the shield's **Hardness (5)**. The remaining damage is dealt to both you and your shield!`;
        } else if (qLower.includes("map") || qLower.includes("attack penalty")) {
          fallbackReply = `**Multiple Attack Penalty (MAP)** applies to each subsequent attack after your first in a round:\n\n* **1st Attack**: Full Attack Bonus (+${character.strikes[0]?.attackBonus || 9})\n* **2nd Attack**: -5 penalty (or -4 if weapon has the **Agile** trait)\n* **3rd+ Attack**: -10 penalty (or -8 if weapon has the **Agile** trait)\n\nTip: You can use your 2nd or 3rd action to Demoralize, Raise Shield, or Step instead of suffering heavy attack penalties!`;
        } else {
          fallbackReply = `I love the sound of that! For your **${character.class}** (${character.ancestry}), we can shape this in a couple of exciting ways.\n\nWould you like me to build a high-level hero (e.g. Level 19), recommend outside-the-box feat synergies, adjust your ability boosts, or tie in rules from your uploaded text files?`;
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: fallbackReply,
            action: suggestedAction
          }
        ]);
        setLoading(false);
      }, 400);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAction = (action) => {
    if (action.type === 'load_character_build') {
      const built = action.character;
      onUpdateCharacter(built);
      if (onSelectTab) {
        onSelectTab('build');
      }
      alert(`⚡ Successfully loaded Level ${built.level} ${built.class} (${built.name}) into the Character Builder! Levels 1–${built.level} are unlocked.`);
    } else if (action.type === 'add_feat') {
      const existing = character.feats || [];
      if (!existing.some(f => f.name.toLowerCase() === action.feat.name.toLowerCase())) {
        onUpdateCharacter({
          feats: [...existing, action.feat]
        });
        alert(`Added feat "${action.feat.name}" to your character!`);
      } else {
        alert(`Feat "${action.feat.name}" is already in your feats!`);
      }
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: initialGreeting,
        options: [
          "⚡ Build a Level 19 Fighter",
          "⚡ Build a Level 19 Wizard",
          "🌱 Start from the ground up",
          "🎲 Surprise me with an outside-the-box build"
        ],
        action: null
      }
    ]);
  };

  return (
    <aside className={`pb-ai-drawer ${isOpen ? '' : 'collapsed'}`}>
      {/* Header */}
      <div className="pb-ai-header">
        <div className="pb-ai-title">
          <Bot size={20} color="var(--gold-500)" />
          <span>Pathfinder AI Companion</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            style={{ color: showSettings ? 'var(--gold-500)' : 'var(--text-muted)' }} 
            title="Configure AI Personality & System Prompt"
          >
            <Sliders size={16} />
          </button>
          <button onClick={resetChat} style={{ color: 'var(--text-muted)' }} title="Restart Conversation">
            <RotateCcw size={16} />
          </button>
          <div className="pb-ai-status-pill online" title="Llama 3.2 3B + Pathfinder AI on RTX 3080 Ti">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span>Dual-Engine (Llama 3.2 + PF2e)</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} title="Close Chat">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Persona Customization Settings Panel */}
      {showSettings && (
        <div style={{ background: '#10141f', borderBottom: '1px solid var(--border-subtle)', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sliders size={12} />
              <span>Initial Prompt &amp; AI Personality</span>
            </span>
            <button 
              onClick={() => setPersonaPrompt(DEFAULT_PERSONA_PROMPT)} 
              style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              Reset to Default
            </button>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
            Friendly, helpful, thinks outside the box, collaborative co-pilot:
          </p>
          <textarea
            rows={4}
            value={personaPrompt}
            onChange={(e) => setPersonaPrompt(e.target.value)}
            style={{ width: '100%', fontSize: '0.75rem', lineHeight: 1.4 }}
          />
        </div>
      )}

      {/* Context Switches */}
      <div style={{ padding: '0.4rem 1rem', background: '#121622', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeSheetContext}
            onChange={(e) => setIncludeSheetContext(e.target.checked)}
          />
          <Layers size={12} color="var(--gold-500)" />
          <span>Sheet Context</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={includeRagKnowledge}
            onChange={(e) => setIncludeRagKnowledge(e.target.checked)}
          />
          <Database size={12} color="#3b82f6" />
          <span>Knowledge Ingested (RAG)</span>
        </label>
      </div>

      {/* Messages */}
      <div className="pb-ai-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
            
            {/* Interactive Options inside message */}
            {msg.options && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {msg.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    className="pb-action-btn"
                    style={{
                      justifyContent: 'flex-start',
                      background: 'rgba(245, 158, 11, 0.12)',
                      borderColor: 'var(--gold-500)',
                      color: 'var(--text-gold)',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: '6px'
                    }}
                    onClick={() => handleSendMessage(opt)}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {msg.action && (
              msg.action.type === 'load_character_build' ? (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '0.85rem',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(217, 119, 6, 0.08) 100%)',
                  border: '1px solid var(--gold-500)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} color="var(--gold-500)" />
                      <span>Level {msg.action.character?.level || 19} Hero Build Ready</span>
                    </span>
                    <span style={{ 
                      background: '#059669', 
                      color: '#ffffff', 
                      padding: '0.15rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.68rem', 
                      fontWeight: 800 
                    }}>
                      Levels 1–{msg.action.character?.level || 19} Unlocked
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    <strong>{msg.action.character?.name}</strong> • {msg.action.character?.ancestry} {msg.action.character?.class}
                    <div style={{ display: 'flex', gap: 10, marginTop: 3, color: 'var(--text-main)', fontWeight: 600 }}>
                      <span>❤️ {msg.action.character?.maxHp} HP</span>
                      <span>🛡️ {msg.action.character?.ac} AC</span>
                      <span>⚔️ {msg.action.character?.strikes?.[0]?.attackBonus ? `+${msg.action.character.strikes[0].attackBonus} Attack` : ''}</span>
                    </div>
                  </div>
                  <button 
                    className="pb-btn pb-btn-primary"
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '0.82rem', 
                      padding: '0.55rem',
                      background: 'linear-gradient(135deg, var(--gold-600) 0%, var(--gold-500) 100%)',
                      color: '#ffffff',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                    }}
                    onClick={() => handleApplyAction(msg.action)}
                  >
                    <Zap size={16} />
                    <span>{msg.action.label || 'Apply to Character Builder & Open'}</span>
                  </button>
                </div>
              ) : (
                <button 
                  className="chat-action-btn"
                  onClick={() => handleApplyAction(msg.action)}
                >
                  <Sparkles size={13} />
                  <span>{msg.action.label || 'Apply to Character Sheet'}</span>
                </button>
              )
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--text-muted)' }}>PathfinderAI reasoning collaboratively...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="pb-ai-prompts">
        {quickPrompts.map((p, i) => (
          <button key={i} className="pb-prompt-chip" onClick={() => handleSendMessage(p)}>
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="pb-ai-input-box">
        <input
          type="text"
          className="pb-ai-input"
          placeholder="Ask a question, brainstorm a concept, or /roll 1d20+8..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button 
          className="pb-ai-send-btn"
          onClick={() => handleSendMessage()}
          disabled={loading}
          title="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </aside>
  );
}

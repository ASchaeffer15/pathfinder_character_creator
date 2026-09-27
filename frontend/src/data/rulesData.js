export const ANCESTRIES = [
  {
    id: "human",
    name: "Human",
    hp: 8,
    size: "Medium",
    speed: 25,
    boosts: ["Free", "Free"],
    flaws: [],
    languages: ["Common", "Additional"],
    description: "Versatile and ambitious, humans are the most adaptable people in Golarion.",
    heritages: [
      { id: "versatile", name: "Versatile Heritage", description: "You gain a general feat of your choice at 1st level." },
      { id: "skilled", name: "Skilled Heritage", description: "You become trained in one skill of your choice, and gain a skill feat for that skill." },
      { id: "half-elf", name: "Half-Elf", description: "You have an elf parent. You gain low-light vision and access to elf feats." },
      { id: "half-orc", name: "Half-Orc", description: "You have an orc parent. You gain low-light vision and access to orc feats." }
    ],
    feats: [
      { id: "natural-ambition", name: "Natural Ambition", level: 1, type: "Ancestry", description: "You gain a 1st-level class feat for your class." },
      { id: "cooperative-nature", name: "Cooperative Nature", level: 1, type: "Ancestry", description: "You gain a +4 circumstance bonus on checks to Aid." },
      { id: "general-training", name: "General Training", level: 1, type: "Ancestry", description: "You gain a 1st-level general feat." }
    ]
  },
  {
    id: "dwarf",
    name: "Dwarf",
    hp: 10,
    size: "Medium",
    speed: 20,
    boosts: ["Constitution", "Wisdom", "Free"],
    flaws: ["Charisma"],
    languages: ["Common", "Dwarven"],
    description: "Stout, traditional, and resilient folk who hail from majestic mountain fortresses.",
    heritages: [
      { id: "strong-blooded", name: "Strong-Blooded Dwarf", description: "You gain poison resistance equal to half your level and +2 to saves vs poison." },
      { id: "rock-dwarf", name: "Rock Dwarf", description: "+2 circumstance bonus to Fortitude/Reflex against Shove and Trip." },
      { id: "ancient-blooded", name: "Ancient-Blooded Dwarf", description: "You gain the Call upon Ancient Blood reaction against magical effects." }
    ],
    feats: [
      { id: "dwarven-weapon-familiarity", name: "Dwarven Weapon Familiarity", level: 1, type: "Ancestry", description: "Trained in battleaxe, pick, warhammer; advance martial dwarf weapons." },
      { id: "rock-runner", name: "Rock Runner", level: 1, type: "Ancestry", description: "Ignore difficult terrain caused by rubble and uneven stone ground." },
      { id: "stonecunning", name: "Stonecunning", level: 1, type: "Ancestry", description: "You automatically gain a check to notice unusual stonework." }
    ]
  },
  {
    id: "elf",
    name: "Elf",
    hp: 6,
    size: "Medium",
    speed: 30,
    boosts: ["Dexterity", "Intelligence", "Free"],
    flaws: ["Constitution"],
    languages: ["Common", "Elven"],
    description: "Graceful, long-lived scholars, rangers, and spellweavers deeply attuned to nature and magic.",
    heritages: [
      { id: "ancient-elf", name: "Ancient Elf", description: "You gain a multiclass dedication feat at 1st level, reflecting centuries of study." },
      { id: "cavern-elf", name: "Cavern Elf", description: "You gain darkvision, allowing you to see in complete darkness." },
      { id: "whisper-elf", name: "Whisper Elf", description: "Your ears are attuned to subtle sounds. Gain +2 bonus to seek hidden creatures." }
    ],
    feats: [
      { id: "nimble-elf", name: "Nimble Elf", level: 1, type: "Ancestry", description: "Your Speed increases by 5 feet." },
      { id: "elven-lore", name: "Elven Lore", level: 1, type: "Ancestry", description: "Trained in Arcana and Nature, plus Elven Lore." },
      { id: "elven-weapon-familiarity", name: "Elven Weapon Familiarity", level: 1, type: "Ancestry", description: "Familiarity with longbows, composite longbows, and rapiers." }
    ]
  },
  {
    id: "gnome",
    name: "Gnome",
    hp: 8,
    size: "Small",
    speed: 25,
    boosts: ["Constitution", "Charisma", "Free"],
    flaws: ["Strength"],
    languages: ["Common", "Gnomish", "Sylvan"],
    description: "Exuberant, curious beings with deep ties to the vibrant realm of the First World.",
    heritages: [
      { id: "fey-touched", name: "Fey-Touched Gnome", description: "You can cast one primal cantrip at will as an innate spell." },
      { id: "sensate", name: "Sensate Gnome", description: "You gain low-light vision and an uncanny sense of smell (imprecise scent 30ft)." }
    ],
    feats: [
      { id: "animal-elocutionist", name: "Animal Elocutionist", level: 1, type: "Ancestry", description: "You can speak with animals at all times." },
      { id: "first-world-magic", name: "First World Magic", level: 1, type: "Ancestry", description: "Gain an innate primal cantrip with high spell DC." }
    ]
  },
  {
    id: "goblin",
    name: "Goblin",
    hp: 6,
    size: "Small",
    speed: 25,
    boosts: ["Dexterity", "Charisma", "Free"],
    flaws: ["Wisdom"],
    languages: ["Common", "Goblin"],
    description: "Scrappy, energetic survivors renowned for their songs, fire obsession, and tenacity.",
    heritages: [
      { id: "charhide", name: "Charhide Goblin", description: "Fire resistance equal to half your level, and recover quickly from persistent fire." },
      { id: "unbreakable", name: "Unbreakable Goblin", description: "You bounce back from harm. Max HP increases by +4 (total 10 from ancestry)." }
    ],
    feats: [
      { id: "burn-it", name: "Burn It!", level: 1, type: "Ancestry", description: "Fire attacks deal +1 status damage; spells and bombs gain bonus." },
      { id: "goblin-scuttle", name: "Goblin Scuttle", level: 1, type: "Ancestry", description: "Reaction to Step when an ally ends a move action adjacent to you." }
    ]
  }
];

export const BACKGROUNDS = [
  {
    id: "warrior",
    name: "Warrior",
    boosts: ["Strength", "Constitution"],
    freeBoost: true,
    skill: "Athletics",
    lore: "Warfare Lore",
    feat: "Intimidating Glare",
    description: "You fought in battles or served in a mercenary troop. You know military tactics and warfare."
  },
  {
    id: "field-medic",
    name: "Field Medic",
    boosts: ["Constitution", "Wisdom"],
    freeBoost: true,
    skill: "Medicine",
    lore: "Battleground Lore",
    feat: "Battle Medicine",
    description: "You patched wounds under fire and stabilized comrades amidst the blood and chaos of war."
  },
  {
    id: "scholar",
    name: "Scholar",
    boosts: ["Intelligence", "Wisdom"],
    freeBoost: true,
    skill: "Arcana",
    lore: "Academia Lore",
    feat: "Assurance (Arcana)",
    description: "You studied ancient libraries, tomes of history, and arcane theory in academies."
  },
  {
    id: "street-urchin",
    name: "Street Urchin",
    boosts: ["Dexterity", "Constitution"],
    freeBoost: true,
    skill: "Thievery",
    lore: "Underworld Lore",
    feat: "Pickpocket",
    description: "You survived on crowded city streets by your wits, agile fingers, and fast feet."
  },
  {
    id: "gladiator",
    name: "Gladiator",
    boosts: ["Strength", "Charisma"],
    freeBoost: true,
    skill: "Performance",
    lore: "Gladiatorial Lore",
    feat: "Fancy Moves",
    description: "The arena was your stage and school. You know how to play the crowd and strike decisively."
  },
  {
    id: "bounty-hunter",
    name: "Bounty Hunter",
    boosts: ["Strength", "Wisdom"],
    freeBoost: true,
    skill: "Survival",
    lore: "Legal Lore",
    feat: "Experienced Tracker",
    description: "You track down dangerous targets across wilderness and alleys for coin and justice."
  }
];

export const CLASSES = [
  {
    id: "fighter",
    name: "Fighter",
    keyAbility: ["Strength", "Dexterity"],
    hpPerLevel: 10,
    perceptionProf: "Expert",
    fortitudeProf: "Expert",
    reflexProf: "Expert",
    willProf: "Trained",
    attacks: "Expert in Simple & Martial Weapons, Trained in Advanced",
    defenses: "Trained in all Armor & Unarmored",
    description: "Unmatched masters of weapon combat, battlefield positioning, and devastating tactical strikes.",
    classFeats: [
      { id: "sudden-charge", name: "Sudden Charge", level: 1, actions: 2, tags: ["Flourish", "Open"], description: "Stride twice. If you end your movement within melee reach of an enemy, you can make a melee Strike." },
      { id: "power-attack", name: "Power Attack", level: 1, actions: 2, tags: ["Flourish"], description: "Make a melee Strike. If it hits, deal an extra die of weapon damage." },
      { id: "reactive-shield", name: "Reactive Shield", level: 1, actions: "Reaction", tags: [], description: "Trigger: An enemy hits you with a melee Strike. Gain +2 AC from raising your shield before the damage is dealt." },
      { id: "point-blank-shot", name: "Point-Blank Shot", level: 1, actions: 1, tags: ["Open", "Stance"], description: "You gain a +2 circumstance bonus to damage rolls with ranged volley weapons." }
    ]
  },
  {
    id: "wizard",
    name: "Wizard",
    keyAbility: ["Intelligence"],
    hpPerLevel: 6,
    perceptionProf: "Trained",
    fortitudeProf: "Trained",
    reflexProf: "Trained",
    willProf: "Expert",
    attacks: "Trained in Club, Dagger, Crossbow, Heavy Crossbow, Staff",
    defenses: "Trained in Unarmored Defense",
    spellTradition: "Arcane",
    description: "Scholars of esoteric secrets who alter reality through complex formulae, incantations, and prepared spell slots.",
    classFeats: [
      { id: "reach-spell", name: "Reach Spell", level: 1, actions: 1, tags: ["Metamagic", "Concentrate"], description: "If the next spell you cast has a range, increase its range by 30 feet." },
      { id: "familiar", name: "Familiar", level: 1, actions: 0, tags: [], description: "You gain a magical familiar that assists in study and scouting." },
      { id: "widen-spell", name: "Widen Spell", level: 1, actions: 1, tags: ["Metamagic", "Concentrate"], description: "Increase the radius of burst/cone spells by 5 to 10 feet." }
    ]
  },
  {
    id: "rogue",
    name: "Rogue",
    keyAbility: ["Dexterity", "Strength", "Charisma", "Intelligence"],
    hpPerLevel: 8,
    perceptionProf: "Expert",
    fortitudeProf: "Trained",
    reflexProf: "Expert",
    willProf: "Expert",
    attacks: "Trained in Simple, Rapier, Shortsword, Sap, Shortbow",
    defenses: "Trained in Light Armor & Unarmored",
    description: "Cunning infiltrators and precision combatants who exploit enemy vulnerabilities for deadly sneak attacks.",
    classFeats: [
      { id: "nimble-dodge", name: "Nimble Dodge", level: 1, actions: "Reaction", tags: [], description: "Trigger: You are targeted by a melee or ranged attack. Gain a +2 circumstance bonus to AC against the triggering attack." },
      { id: "trap-finder", name: "Trap Finder", level: 1, actions: 0, tags: [], description: "+1 circumstance bonus to find traps and +1 to AC/saves vs traps." },
      { id: "twin-feint", name: "Twin Feint", level: 1, actions: 2, tags: [], description: "Make two melee Strikes with different weapons. The second Strike treats the target as off-guard." }
    ]
  },
  {
    id: "cleric",
    name: "Cleric",
    keyAbility: ["Wisdom"],
    hpPerLevel: 8,
    perceptionProf: "Trained",
    fortitudeProf: "Expert",
    reflexProf: "Trained",
    willProf: "Expert",
    attacks: "Trained in Simple Weapons & Deity's Favored Weapon",
    defenses: "Trained in Unarmored (or Light/Medium for Warpriest)",
    spellTradition: "Divine",
    description: "Vessels of divine power who channel divine fonts for mass healing or holy wrath in service of their deity.",
    classFeats: [
      { id: "healing-hands", name: "Healing Hands", level: 1, actions: 0, tags: [], description: "When you cast Heal, roll d10s instead of d8s." },
      { id: "emblazon-armament", name: "Emblazon Armament", level: 1, actions: 0, tags: ["Exploration"], description: "Emblazon your holy symbol onto a weapon or shield, granting +1 damage or +1 hardness." },
      { id: "reach-spell-cleric", name: "Reach Spell", level: 1, actions: 1, tags: ["Concentrate", "Metamagic"], description: "Increase spell range by 30 feet." }
    ]
  },
  {
    id: "champion",
    name: "Champion",
    keyAbility: ["Strength", "Dexterity"],
    hpPerLevel: 10,
    perceptionProf: "Trained",
    fortitudeProf: "Expert",
    reflexProf: "Trained",
    willProf: "Expert",
    attacks: "Trained in Simple & Martial Weapons",
    defenses: "Expert in Heavy, Medium, Light Armor and Shields",
    description: "Armored holy warriors devoted to a righteous cause, protecting allies with powerful retributive reactions.",
    classFeats: [
      { id: "ranged-reprisal", name: "Ranged Reprisal", level: 1, actions: 0, tags: [], description: "Use Retributive Strike with a ranged weapon or step within reach." },
      { id: "weight-of-guilt", name: "Weight of Guilt", level: 1, actions: 0, tags: [], description: "Retributive strike also makes enemy stupefied 1." }
    ]
  },
  {
    id: "barbarian",
    name: "Barbarian",
    keyAbility: ["Strength"],
    hpPerLevel: 12,
    perceptionProf: "Expert",
    fortitudeProf: "Expert",
    reflexProf: "Trained",
    willProf: "Expert",
    attacks: "Trained in Simple & Martial Weapons",
    defenses: "Trained in Light, Medium, Unarmored",
    description: "Berserk warriors channeling primal fury into supernatural strength and resilience.",
    classFeats: [
      { id: "raging-intimidation", name: "Raging Intimidation", level: 1, actions: 0, tags: [], description: "You can Demoralize and Scare to Death while in a Rage." },
      { id: "sudden-charge-barb", name: "Sudden Charge", level: 1, actions: 2, tags: ["Flourish"], description: "Stride twice and make a melee Strike." }
    ]
  }
];

export const SKILLS_LIST = [
  { id: "acrobatics", name: "Acrobatics", attribute: "DEX", description: "Balance, tumble through enemies, squeeze." },
  { id: "arcana", name: "Arcana", attribute: "INT", description: "Arcane theory, identify magical creatures, recall arcane lore." },
  { id: "athletics", name: "Athletics", attribute: "STR", description: "Climb, force open, grapple, high jump, shove, swim, trip." },
  { id: "crafting", name: "Crafting", attribute: "INT", description: "Repair shields, craft weapons, identify alchemy." },
  { id: "deception", name: "Deception", attribute: "CHA", description: "Lie, feint in combat, create diversion, disguise." },
  { id: "diplomacy", name: "Diplomacy", attribute: "CHA", description: "Make an impression, gather information, request aid." },
  { id: "intimidation", name: "Intimidation", attribute: "CHA", description: "Demoralize foes in battle, coerce surrender." },
  { id: "medicine", name: "Medicine", attribute: "WIS", description: "Treat wounds, treat poison, battle medicine." },
  { id: "nature", name: "Nature", attribute: "WIS", description: "Command an animal, recall knowledge on beasts and plants." },
  { id: "occultism", name: "Occultism", attribute: "INT", description: "Ancient spirits, esoteric philosophy, bizarre rituals." },
  { id: "performance", name: "Performance", attribute: "CHA", description: "Sing, dance, play an instrument, fascinate an audience." },
  { id: "religion", name: "Religion", attribute: "WIS", description: "Gods, divine heralds, unholy abominations, undead." },
  { id: "society", name: "Society", attribute: "INT", description: "Local laws, court etiquette, decipher ancient handwriting." },
  { id: "stealth", name: "Stealth", attribute: "DEX", description: "Hide in shadows, sneak past sentries, conceal items." },
  { id: "survival", name: "Survival", attribute: "WIS", description: "Track quarry, forage, subsist in the wilderness." },
  { id: "thievery", name: "Thievery", attribute: "DEX", description: "Pick locks, disable traps, steal without detection." },
  { id: "warfare-lore", name: "Warfare Lore", attribute: "INT", description: "Military formations, sieges, mercenary history." }
];

export const WEAPONS_DB = [
  { id: "longsword", name: "Longsword", category: "Martial", damage: "1d8", damageType: "Slashing", bulk: 1, traits: ["Versatile P"] },
  { id: "greatsword", name: "Greatsword", category: "Martial", damage: "1d12", damageType: "Slashing", bulk: 2, traits: ["Two-Handed", "Versatile P"] },
  { id: "shortbow", name: "Composite Shortbow", category: "Martial", damage: "1d6", damageType: "Piercing", bulk: 1, traits: ["Deadly d10", "Propulsive", "Range 60ft"] },
  { id: "dagger", name: "Dagger", category: "Simple", damage: "1d4", damageType: "Piercing", bulk: "L", traits: ["Agile", "Finesse", "Thrown 10ft", "Versatile S"] },
  { id: "shield-bash", name: "Shield Bash", category: "Simple", damage: "1d4", damageType: "Bludgeoning", bulk: 0, traits: [] },
  { id: "unarmed", name: "Fist / Unarmed", category: "Simple", damage: "1d4", damageType: "Bludgeoning", bulk: 0, traits: ["Agile", "Finesse", "Nonlethal"] }
];

export const ARMOR_DB = [
  { id: "unarmored", name: "Unarmored Clothing", category: "Unarmored", acBonus: 0, dexCap: 5, checkPenalty: 0, speedPenalty: 0, bulk: "L" },
  { id: "leather", name: "Leather Armor", category: "Light", acBonus: 1, dexCap: 4, checkPenalty: -1, speedPenalty: 0, bulk: 1 },
  { id: "chainmail", name: "Chain Mail", category: "Medium", acBonus: 4, dexCap: 1, checkPenalty: -2, speedPenalty: -5, bulk: 2, traits: ["Flexible", "Noisy"] },
  { id: "fullplate", name: "Full Plate", category: "Heavy", acBonus: 6, dexCap: 0, checkPenalty: -3, speedPenalty: -10, bulk: 4, traits: ["Bulwark"] }
];

export const SPELLS_DB = [
  { id: "electric-arc", name: "Electric Arc", rank: 0, tradition: ["Arcane", "Primal"], actions: 2, range: "30 feet", targets: "1 or 2 creatures", save: "Basic Reflex", description: "An arc of lightning leaps from one target to another, dealing 1d4 + casting mod electricity damage." },
  { id: "shield-spell", name: "Shield", rank: 0, tradition: ["Arcane", "Divine", "Occult", "Primal"], actions: 1, duration: "until start of next turn", description: "A magical shield raises in front of you. Gain +1 circumstance bonus to AC and you can use the Shield Block reaction (Hardness 5)." },
  { id: "guidance", name: "Guidance", rank: 0, tradition: ["Divine", "Occult", "Primal"], actions: 1, range: "30 feet", description: "Target gains +1 status bonus to one attack roll, Perception check, saving throw, or skill check." },
  { id: "daze", name: "Daze", rank: 0, tradition: ["Arcane", "Divine", "Occult"], actions: 2, range: "60 feet", save: "Will", description: "Cloud a target's mind with mental static, dealing casting mod mental damage, stunned 1 on critical failure." },
  { id: "heal", name: "Heal", rank: 1, tradition: ["Divine", "Primal"], actions: "1 to 3", range: "Touch / 30ft / 30ft emanation", description: "Channel positive healing energy. 1 action: 1d8 touch. 2 actions: 1d8+8 at 30ft. 3 actions: 1d8 to all living in 30ft burst." },
  { id: "magic-missile", name: "Force Barrage (Magic Missile)", rank: 1, tradition: ["Arcane", "Occult"], actions: "1 to 3", range: "120 feet", description: "Fire 1 to 3 unerring darts of pure force that automatically strike their targets for 1d4+1 force damage each." },
  { id: "grease", name: "Grease", rank: 1, tradition: ["Arcane", "Primal"], actions: 2, range: "120 feet", area: "10-foot burst", description: "Slick grease covers the floor. Creatures in the area must succeed at a Reflex save or fall prone." },
  { id: "sudden-blight", name: "Sudden Blight", rank: 2, tradition: ["Divine", "Primal"], actions: 2, range: "120 feet", area: "20-foot burst", save: "Fortitude", description: "Sap life energy from all targets in the area, dealing 2d10 negative/void damage." },
  { id: "dispel-magic", name: "Dispel Magic", rank: 2, tradition: ["Arcane", "Divine", "Occult", "Primal"], actions: 2, range: "120 feet", description: "Unravel an active magical effect or ongoing spell." }
];

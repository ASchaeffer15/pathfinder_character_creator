import sys
sys.stdout.reconfigure(encoding='utf-8')
from backend.model_service import model_service

tests = [
    'it should also be able to interpret class, ancestry, background, and feat details from the user',
    'Interpret this: Class: Wizard, Ancestry: Elf, Background: Scholar, Feats: Reach Spell, Quickened Casting',
    'Build a level 19 Leshy Druid with the Herbalist background and taking Green Tongue, Timber Transformation, and Cloud Jump feats',
    'Can you interpret a character with class barbarian, ancestry orc, background gladiator, and feat sudden charge?',
    'Level: 19, Class: Rogue, Ancestry: Catfolk, Background: Street Urchin, Feats: Nimble Dodge, Mobility, Cloud Jump',
    'create a level 19 dwarf champion with blacksmith background and shield block, quick shield block'
]

for t in tests:
    res = model_service._check_character_build_request(t)
    print(f"PROMPT: {t[:65]}...")
    print(f"  -> Triggered: {res is not None}")
    if res:
        print("  -> Action Label:", res.get("suggested_action", {}).get("label"))
        char = res.get("suggested_action", {}).get("character", {})
        print(f"  -> Character: Level {char.get('level')} {char.get('ancestry')} ({char.get('heritage')}) {char.get('class')}")
        print(f"  -> Background: {char.get('background')}, Primary Weapon: {char.get('strikes', [{}])[0].get('name')}")
        feat_names = [f["name"] for f in char.get("feats", [])]
        print(f"  -> Feats count: {len(feat_names)}, Sample Feats: {feat_names[:5]}")
    print("----------------------------------------------------")

import sys
sys.stdout.reconfigure(encoding='utf-8')
from backend.character_builder import parse_user_intent, build_character

prompts = [
    'Build a level 19 Leshy Druid with the Herbalist background and taking Green Tongue, Timber Transformation, and Cloud Jump feats',
    'make a level 19 orc barbarian with gladiator background and greataxe with sudden charge and scare to death',
    'create a level 19 dwarf champion with blacksmith background and shield block, quick shield block',
    'Level: 19, Class: Rogue, Ancestry: Catfolk, Background: Street Urchin, Feats: Nimble Dodge, Mobility, Cloud Jump'
]

for p in prompts:
    intent = parse_user_intent(p)
    char = build_character(
        level=intent['level'],
        class_name=intent['class'],
        ancestry_name=intent['ancestry'],
        heritage_name=intent['heritage'],
        background_name=intent['background'],
        requested_feats=intent['feats'],
        weapon_preference=intent['weapon'],
        hero_name=intent['hero_name']
    )
    print("PROMPT:", p[:60])
    print(f"  -> Forged: Level {char['level']} {char['ancestry']} ({char['heritage']}) {char['class']}")
    print(f"  -> Background: {char['background']}, HP: {char['currentHp']}, AC: {char['ac']}")
    print(f"  -> Primary Weapon: {char['strikes'][0]['name']}")
    feat_names = [f['name'].lower() for f in char['feats']]
    matched = [rf for rf in intent['feats'] if rf.lower() in feat_names]
    print(f"  -> Requested Feats Successfully Injected: {matched}")
    print("-------------------------------------------------------------")

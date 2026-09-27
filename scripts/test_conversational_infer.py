import sys
sys.stdout.reconfigure(encoding='utf-8')
from backend.character_builder import parse_user_intent

def infer_conversational_prompt(user_message):
    intent = parse_user_intent(user_message)
    weapon_desc = intent["weapon"] if intent.get("weapon") else "Class primary weapon"
    feats_desc = ", ".join(intent["feats"]) if intent.get("feats") else "Optimal class synergy feats"
    p_prompt = (
        f"Generate a mathematically legal Pathfinder 2e Remaster character for the Character Builder. "
        f"Target Level: {intent['level']}. "
        f"Class: {intent['class']}. "
        f"Ancestry: {intent['ancestry']} (Heritage: {intent['heritage']}). "
        f"Background: {intent['background']}. "
        f"Combat Armament: {weapon_desc}. "
        f"User Feats to Integrate: {feats_desc}. "
        f"Level Gating: Keep levels 1 to {intent['level']} unlocked and active, and level {min(20, intent['level']+1)} locked."
    )
    return intent, p_prompt

tests = [
    'Build a level 19 Leshy Druid with the Herbalist background and taking Green Tongue, Timber Transformation, and Cloud Jump feats',
    'Interpret this: Class: Wizard, Ancestry: Elf, Background: Scholar, Feats: Reach Spell, Quickened Casting',
    'Can you interpret a character with class barbarian, ancestry orc, background gladiator, and feat sudden charge?',
    'Level: 19, Class: Rogue, Ancestry: Catfolk, Background: Street Urchin, Feats: Nimble Dodge, Mobility, Cloud Jump'
]

for t in tests:
    intent, prompt = infer_conversational_prompt(t)
    print("USER MESSAGE:", t[:60])
    print(f"  -> Inferred Level: {intent['level']}, Class: {intent['class']}, Ancestry: {intent['ancestry']}")
    print("  -> Synthesized Prompt for Pathfinder LLM:\n    ", prompt)
    print("----------------------------------------------------")

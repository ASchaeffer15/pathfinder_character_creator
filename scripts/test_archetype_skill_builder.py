import urllib.request
import json
from backend.character_builder import parse_user_intent, build_character

def test():
    print("--- Testing Builder Direct ---")
    p1 = "Level 6 Fighter with Medic Archetype and Doctor's Visitation"
    res1 = parse_user_intent(p1)
    print("Test 1 parse:", res1["class"], res1["level"], "archetype:", res1.get("archetype"), "feats:", res1.get("feats"))

    char1 = build_character(
        level=res1["level"],
        class_name=res1["class"],
        archetype_name=res1.get("archetype"),
        requested_feats=res1.get("feats")
    )
    print("Char 1 archetype:", char1.get("archetype"))
    print("Char 1 archetypeFeats:", [(f["name"], f.get("level")) for f in char1.get("archetypeFeats", [])])
    print("Char 1 skillFeats:", [(f["name"], f.get("level")) for f in char1.get("skillFeats", [])])
    print("Char 1 Medicine proficiency:", char1["skillsProf"].get("medicine"))

    print("\n--- Testing API /api/chat ---")
    payload = {"message": "Build a level 10 Fighter with Medic Archetype and Doctor's Visitation"}
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode("utf-8"))
    char = data.get("suggested_action", {}).get("character", {})
    print("Chat API Archetype in char:", char.get("archetype"))
    print("Chat API Archetype feats:", [(f["name"], f.get("level")) for f in char.get("archetypeFeats", [])])
    print("Chat API Skill feats:", [(f["name"], f.get("level")) for f in char.get("skillFeats", [])])
    print("Chat API Medicine Prof:", char.get("skillsProf", {}).get("medicine"))

if __name__ == "__main__":
    test()

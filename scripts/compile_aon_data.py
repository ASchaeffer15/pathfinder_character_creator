"""
Archives of Nethys Data Compiler for Pathfinder 2e Character Creator
Compiles raw/parsed AoN datasets (from aon_scraper) into the character creator dataset:
- frontend/src/data/srdRemasterData.json
- Indexes over 8,800 feats, 90+ ancestries, 400+ heritages, 600+ backgrounds, and all 22+ classes.
- Prioritizes Remaster rules (Player Core, Player Core 2, Rage of Elements, War of Immortals).
"""

import os
import json
import re
from typing import Dict, Any, List, Optional

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AON_PARSED_DIR = os.path.join(BASE_DIR, "aon_scraper", "parsed")
OUTPUT_JSON = os.path.join(BASE_DIR, "frontend", "src", "data", "srdRemasterData.json")

# Clean text from Archives of Nethys markup
def clean_aon_text(text: Optional[str]) -> str:
    if not text:
        return ""
    # Replace broken encodings or unicode artifacts
    cleaned = text.replace('\ufffd', "'").replace('\u2019', "'").replace('\u2018', "'").replace('\u201c', '"').replace('\u201d', '"')
    # Strip HTML / markdown tags
    cleaned = re.sub(r'<[^>]+>', ' ', cleaned)
    cleaned = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def parse_action_cost(act_str: Any) -> Any:
    if isinstance(act_str, int):
        return act_str
    if not act_str:
        return 0
    s = str(act_str).lower()
    if "single action" in s or "1 action" in s or s == "1":
        return 1
    if "two action" in s or "2 action" in s or s == "2":
        return 2
    if "three action" in s or "3 action" in s or s == "3":
        return 3
    if "reaction" in s:
        return "Reaction"
    if "free" in s:
        return "Free"
    return 0

def compile_aon():
    print(f"[*] Reading AoN datasets from: {AON_PARSED_DIR}")
    if not os.path.exists(AON_PARSED_DIR):
        raise FileNotFoundError(f"AoN parsed directory not found at {AON_PARSED_DIR}")

    # 1. Load Heritages
    heritages_file = os.path.join(AON_PARSED_DIR, "heritage.json")
    all_heritages = []
    if os.path.exists(heritages_file):
        with open(heritages_file, "r", encoding="utf-8") as f:
            all_heritages = json.load(f)
    print(f"[*] Loaded {len(all_heritages)} heritages from AoN.")

    # 2. Load Ancestries
    anc_file = os.path.join(AON_PARSED_DIR, "ancestry.json")
    raw_ancestries = []
    if os.path.exists(anc_file):
        with open(anc_file, "r", encoding="utf-8") as f:
            raw_ancestries = json.load(f)
    print(f"[*] Loaded {len(raw_ancestries)} ancestry records from AoN.")

    # Map heritages to ancestries
    ancestry_names = set()
    for a in raw_ancestries:
        if a.get("type") == "Ancestry":
            ancestry_names.add(a.get("name"))

    heritages_by_ancestry: Dict[str, List[Dict[str, Any]]] = {}
    versatile_heritages = []

    for h in all_heritages:
        h_name = h.get("name", "").strip()
        h_id = h.get("id") or re.sub(r'[^a-z0-9]+', '-', h_name.lower()).strip('-')
        desc = clean_aon_text(h.get("summary") or h.get("text", ""))[:250]
        h_obj = {"id": h_id, "name": h_name, "description": desc}

        matched = False
        for anc in sorted(ancestry_names, key=lambda x: len(x), reverse=True):
            # Check if ancestry name or common adjective appears in heritage name
            adj_map = {"Dwarf": ["dwarf", "dwarven"], "Elf": ["elf", "elven"], "Gnome": ["gnome", "gnomish"]}
            patterns = adj_map.get(anc, [anc.lower()])
            if any(p in h_name.lower() for p in patterns):
                heritages_by_ancestry.setdefault(anc.lower(), []).append(h_obj)
                matched = True
                break
        if not matched:
            versatile_heritages.append(h_obj)

    # Also include versatile heritages from ancestry.json (Changeling, Dhampir, etc.)
    for a in raw_ancestries:
        if a.get("type") in ["Versatile Heritage", "Half-Human Heritage"]:
            vh_name = a.get("name", "").strip()
            vh_id = re.sub(r'[^a-z0-9]+', '-', vh_name.lower()).strip('-')
            desc = clean_aon_text(a.get("summary") or a.get("text", ""))[:250]
            if not any(v["name"].lower() == vh_name.lower() for v in versatile_heritages):
                versatile_heritages.append({"id": vh_id, "name": vh_name, "description": desc})

    compiled_ancestries = []
    seen_anc = set()
    for a in raw_ancestries:
        if a.get("type") != "Ancestry":
            continue
        name = a.get("name", "").strip()
        if name.lower() in seen_anc:
            continue
        seen_anc.add(name.lower())

        hp = a.get("hp", 8)
        if isinstance(hp, str) and hp.isdigit():
            hp = int(hp)
        elif not isinstance(hp, int):
            hp = 8

        speed_data = a.get("speed", {})
        speed = 25
        if isinstance(speed_data, dict):
            speed = speed_data.get("land", speed_data.get("max", 25))
        elif isinstance(speed_data, (int, float)):
            speed = int(speed_data)

        size_data = a.get("size", ["Medium"])
        size = size_data[0] if isinstance(size_data, list) and size_data else "Medium"

        desc = clean_aon_text(a.get("summary") or a.get("text", ""))[:320]
        abilities = a.get("ability") or a.get("attribute") or ["Free"]
        flaws = a.get("ability_flaw") or a.get("attribute_flaw") or []

        # Get specific heritages + append top versatile heritages
        spec_heritages = heritages_by_ancestry.get(name.lower(), [])
        if not spec_heritages:
            # Fallback default heritage
            spec_heritages = [{"id": f"{name.lower()}-heritage", "name": f"Ancient {name}", "description": f"Carrying the revered traditions of the {name} kin."}]
        
        all_anc_heritages = list(spec_heritages)
        # Add popular versatile heritages
        for vh in versatile_heritages[:5]:
            if not any(h["name"].lower() == vh["name"].lower() for h in all_anc_heritages):
                all_anc_heritages.append(vh)

        compiled_ancestries.append({
            "id": re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'),
            "name": name,
            "hp": hp,
            "speed": speed,
            "size": size,
            "description": desc,
            "abilities": abilities,
            "flaws": flaws,
            "heritages": all_anc_heritages
        })

    print(f"[+] Compiled {len(compiled_ancestries)} unique ancestries.")

    # 3. Load Backgrounds
    bg_file = os.path.join(AON_PARSED_DIR, "background.json")
    raw_backgrounds = []
    if os.path.exists(bg_file):
        with open(bg_file, "r", encoding="utf-8") as f:
            raw_backgrounds = json.load(f)

    compiled_backgrounds = []
    seen_bg = set()
    for b in raw_backgrounds:
        name = b.get("name", "").strip()
        if not name or name.lower() in seen_bg:
            continue
        seen_bg.add(name.lower())

        boosts = b.get("attribute") or b.get("ability") or ["Strength", "Constitution"]
        # Skills
        skill_raw = b.get("skill") or ["Athletics"]
        skill_name = skill_raw[0] if isinstance(skill_raw, list) and skill_raw else str(skill_raw)
        skill_name = clean_aon_text(skill_name).split(" and ")[0].split(",")[0].strip()
        if not skill_name or len(skill_name) > 30:
            skill_name = "Lore"

        # Feats
        feat_raw = b.get("feat") or ["Assurance"]
        feat_name = feat_raw[0] if isinstance(feat_raw, list) and feat_raw else str(feat_raw)
        feat_name = clean_aon_text(feat_name).strip()

        desc = clean_aon_text(b.get("summary") or b.get("text", ""))[:250]

        compiled_backgrounds.append({
            "id": re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'),
            "name": name,
            "boosts": boosts,
            "skill": skill_name,
            "feat": feat_name,
            "description": desc
        })

    print(f"[+] Compiled {len(compiled_backgrounds)} unique backgrounds.")

    # 4. Load Classes
    class_file = os.path.join(AON_PARSED_DIR, "class.json")
    raw_classes = []
    if os.path.exists(class_file):
        with open(class_file, "r", encoding="utf-8") as f:
            raw_classes = json.load(f)

    # Sort so Remaster sources (Player Core, Player Core 2, Rage of Elements) come FIRST
    def class_sort_key(c):
        src = str(c.get("primary_source", "")).lower()
        if "player core" in src or "remaster" in src:
            return 0
        if "rage of elements" in src or "war of immortals" in src:
            return 1
        return 2

    raw_classes.sort(key=class_sort_key)

    compiled_classes = []
    seen_cls = set()
    for c in raw_classes:
        name = c.get("name", "").strip()
        if not name or name.lower() in seen_cls:
            continue
        seen_cls.add(name.lower())

        hp = c.get("hp", 8)
        if isinstance(hp, str) and hp.isdigit():
            hp = int(hp)
        elif not isinstance(hp, int):
            hp = 8

        abilities = c.get("attribute") or c.get("ability") or ["Strength"]
        clean_abilities = [a for a in abilities if a.lower() not in ["other", "free", "none"]]
        if not clean_abilities:
            clean_abilities = ["Strength"]

        fort = c.get("fortitude_proficiency", "Trained")
        ref = c.get("reflex_proficiency", "Trained")
        will = c.get("will_proficiency", "Trained")
        perc = c.get("perception_proficiency", "Trained")

        attacks_raw = c.get("attack_proficiency", ["Trained in simple weapons"])
        attacks = attacks_raw if isinstance(attacks_raw, str) else "; ".join(attacks_raw)
        
        defenses_raw = c.get("defense_proficiency", ["Trained in unarmored defense"])
        defenses = defenses_raw if isinstance(defenses_raw, str) else "; ".join(defenses_raw)

        desc = clean_aon_text(c.get("summary") or c.get("text", ""))[:300]

        compiled_classes.append({
            "id": name.lower(),
            "name": name,
            "hpPerLevel": hp,
            "keyAbility": clean_abilities,
            "perceptionProf": perc,
            "fortitudeProf": fort,
            "reflexProf": ref,
            "willProf": will,
            "attacks": attacks,
            "defenses": defenses,
            "description": desc
        })

    print(f"[+] Compiled {len(compiled_classes)} canonical classes.")

    # 5. Load Archetypes
    arch_file = os.path.join(AON_PARSED_DIR, "archetype.json")
    raw_archetypes = []
    if os.path.exists(arch_file):
        with open(arch_file, "r", encoding="utf-8") as f:
            raw_archetypes = json.load(f)

    compiled_archetypes = []
    seen_arch = set()
    for a in raw_archetypes:
        name = a.get("name", "").strip()
        if not name or name.lower() in seen_arch:
            continue
        seen_arch.add(name.lower())
        cat_raw = a.get("archetype_category", ["Combat Style"])
        cat = cat_raw[0] if isinstance(cat_raw, list) and cat_raw else str(cat_raw)
        desc = clean_aon_text(a.get("summary") or a.get("text", ""))[:280]
        prereq = clean_aon_text(a.get("prerequisite", ""))
        lvl = a.get("level", 2)
        if isinstance(lvl, str) and lvl.isdigit():
            lvl = int(lvl)
        elif not isinstance(lvl, int):
            lvl = 2

        compiled_archetypes.append({
            "id": re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'),
            "name": name,
            "category": cat,
            "level": lvl,
            "prerequisite": prereq,
            "description": desc
        })
    print(f"[+] Compiled {len(compiled_archetypes)} canonical archetypes.")

    # 6. Load and Categorize Feats
    feat_file = os.path.join(AON_PARSED_DIR, "feat.json")
    raw_feats = []
    if os.path.exists(feat_file):
        with open(feat_file, "r", encoding="utf-8") as f:
            raw_feats = json.load(f)

    # Sort feats prioritizing Remaster
    def feat_sort_key(f):
        src = str(f.get("primary_source", "")).lower()
        if "player core" in src or "remaster" in src:
            return 0
        return 1

    raw_feats.sort(key=feat_sort_key)

    class_feats_db: Dict[str, Dict[int, List[Dict[str, Any]]]] = {}
    skill_feats_db: Dict[int, List[Dict[str, Any]]] = {}
    general_feats_db: Dict[int, List[Dict[str, Any]]] = {}
    ancestry_feats_db: Dict[str, Dict[int, List[Dict[str, Any]]]] = {}
    archetype_feats_db: Dict[str, Dict[int, List[Dict[str, Any]]]] = {}

    known_class_ids = {c["id"]: c["name"] for c in compiled_classes}
    known_anc_ids = {a["id"]: a["name"] for a in compiled_ancestries}

    seen_feats = set()
    total_indexed_feats = 0

    for f in raw_feats:
        name = f.get("name", "").strip()
        if not name or name.lower() in seen_feats:
            continue
        seen_feats.add(name.lower())

        lvl = f.get("level", 1)
        if isinstance(lvl, str) and lvl.isdigit():
            lvl = int(lvl)
        elif not isinstance(lvl, int):
            lvl = 1

        actions = parse_action_cost(f.get("actions"))
        traits = [t.strip() for t in f.get("trait", []) if t.strip()]
        traits_lower = [t.lower() for t in traits]
        desc = clean_aon_text(f.get("summary") or f.get("text", ""))[:280]

        # Skill association
        skill_raw = f.get("skill")
        skill_clean = ""
        if isinstance(skill_raw, list) and skill_raw:
            skill_clean = clean_aon_text(str(skill_raw[0]))
        elif skill_raw:
            skill_clean = clean_aon_text(str(skill_raw))

        prereq_clean = clean_aon_text(f.get("prerequisite", ""))

        feat_archetypes = f.get("archetype", [])
        if isinstance(feat_archetypes, str):
            feat_archetypes = [feat_archetypes]

        feat_obj = {
            "id": re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-'),
            "name": name,
            "level": lvl,
            "actions": actions,
            "tags": traits,
            "prerequisite": prereq_clean,
            "skill": skill_clean,
            "archetype": feat_archetypes,
            "description": desc
        }
        total_indexed_feats += 1

        # Check Skill feat
        if "skill" in traits_lower:
            skill_feats_db.setdefault(lvl, []).append(feat_obj)
        if "general" in traits_lower:
            general_feats_db.setdefault(lvl, []).append(feat_obj)

        # Check Archetype feats
        if "archetype" in traits_lower or "dedication" in traits_lower or feat_archetypes:
            for arch in feat_archetypes:
                arch_key = arch.lower().strip()
                archetype_feats_db.setdefault(arch_key, {}).setdefault(lvl, []).append(feat_obj)
            if not feat_archetypes and ("dedication" in traits_lower or "dedication" in name.lower()):
                ded_arch = re.sub(r'\s+dedication.*$', '', name, flags=re.IGNORECASE).strip().lower()
                if ded_arch:
                    archetype_feats_db.setdefault(ded_arch, {}).setdefault(lvl, []).append(feat_obj)

        # Check Class feats
        for c_id, c_name in known_class_ids.items():
            if c_id in traits_lower or c_name.lower() in traits_lower:
                class_feats_db.setdefault(c_id, {}).setdefault(lvl, []).append(feat_obj)

        # Check Ancestry feats
        for a_id, a_name in known_anc_ids.items():
            if a_id in traits_lower or a_name.lower() in traits_lower:
                ancestry_feats_db.setdefault(a_id, {}).setdefault(lvl, []).append(feat_obj)

    # Ensure all archetypes that have feats are present in compiled_archetypes
    for arch_key in archetype_feats_db:
        if arch_key and not any(a["name"].lower() == arch_key for a in compiled_archetypes):
            ded_feats = [feat for f_list in archetype_feats_db[arch_key].values() for feat in f_list if "dedication" in feat["name"].lower()]
            desc = ded_feats[0]["description"] if ded_feats else f"Feats for the {arch_key.title()} archetype."
            prereq = ded_feats[0].get("prerequisite", "") if ded_feats else ""
            compiled_archetypes.append({
                "id": re.sub(r'[^a-z0-9]+', '-', arch_key).strip('-'),
                "name": arch_key.title(),
                "category": "Combat Style",
                "level": 2,
                "prerequisite": prereq,
                "description": desc
            })
    compiled_archetypes.sort(key=lambda a: a["name"])

    # 7. Load and Index Spells
    spell_file = os.path.join(AON_PARSED_DIR, "spell.json")
    compiled_spells = []
    seen_spells = set()
    if os.path.exists(spell_file):
        with open(spell_file, "r", encoding="utf-8") as f:
            raw_spells = json.load(f)

        for s in raw_spells:
            s_name = s.get("name", "").strip()
            if not s_name or s_name.lower() in seen_spells:
                continue
            seen_spells.add(s_name.lower())

            trad = s.get("tradition", [])
            if isinstance(trad, str):
                trad = [trad]
            trad_clean = [t.capitalize() for t in trad if t and t.capitalize() in ["Arcane", "Divine", "Primal", "Occult", "Elemental"]]

            traits = [t.strip() for t in s.get("trait", []) if t.strip()]
            is_cantrip = s.get("spell_type") == "Cantrip" or any(t.lower() == "cantrip" for t in traits)

            lvl = s.get("level", 1)
            try:
                lvl = int(lvl)
            except Exception:
                lvl = 1
            rank = 0 if is_cantrip else lvl

            act = s.get("actions", "")
            if isinstance(act, int):
                act_str = f"{act} action" if act == 1 else f"{act} actions"
            else:
                act_str = str(act)

            desc = clean_aon_text(s.get("summary") or s.get("text", ""))[:280]

            compiled_spells.append({
                "id": re.sub(r'[^a-z0-9]+', '-', s_name.lower()).strip('-'),
                "name": s_name,
                "rank": rank,
                "tradition": trad_clean,
                "actions": act_str,
                "traits": traits,
                "range": s.get("range", ""),
                "saving_throw": s.get("saving_throw", ""),
                "description": desc
            })
    print(f"[+] Compiled {len(compiled_spells)} unique spells.")

    # 8. Load and Index Weapons
    weapon_file = os.path.join(AON_PARSED_DIR, "weapon.json")
    compiled_weapons = []
    seen_weapons = set()
    if os.path.exists(weapon_file):
        with open(weapon_file, "r", encoding="utf-8") as f:
            raw_weapons = json.load(f)

        for w in raw_weapons:
            w_name = w.get("name", "").strip()
            cat = w.get("weapon_category")
            w_type = w.get("weapon_type")
            if not w_name or not cat or not w_type or cat == "Ammunition":
                continue
            if w_name.lower() in seen_weapons:
                continue
            seen_weapons.add(w_name.lower())

            traits = [t.strip() for t in w.get("trait", []) if t.strip()]
            desc = clean_aon_text(w.get("summary") or w.get("text", ""))[:240]

            bulk = w.get("bulk", 1)
            if isinstance(bulk, str) and bulk.isdigit():
                bulk = int(bulk)

            dmg_type_list = w.get("damage_type", ["Physical"])
            dmg_type_str = ", ".join(dmg_type_list) if isinstance(dmg_type_list, list) else str(dmg_type_list)

            compiled_weapons.append({
                "id": re.sub(r'[^a-z0-9]+', '-', w_name.lower()).strip('-'),
                "name": w_name,
                "category": cat,
                "type": w_type,
                "damage": w.get("damage", "1d6"),
                "damage_die": w.get("damage_die", 6),
                "damage_type": dmg_type_str,
                "hands": str(w.get("hands", "1")),
                "bulk": bulk,
                "traits": traits,
                "description": desc
            })
    print(f"[+] Compiled {len(compiled_weapons)} unique weapons.")

    compiled_dataset = {
        "srd_source": "Archives of Nethys (via LukasParke/archives-of-nethys-scraper)",
        "version": "2.0 Remaster + AoN Live Data",
        "ancestries": compiled_ancestries,
        "backgrounds": compiled_backgrounds,
        "classes": compiled_classes,
        "archetypes": compiled_archetypes,
        "class_feats": class_feats_db,
        "skill_feats": skill_feats_db,
        "general_feats": general_feats_db,
        "ancestry_feats": ancestry_feats_db,
        "archetype_feats": archetype_feats_db,
        "spells": compiled_spells,
        "weapons": compiled_weapons
    }

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(compiled_dataset, f, indent=2, ensure_ascii=False)

    print(f"[+] Successfully compiled AoN dataset to: {OUTPUT_JSON}")
    size_mb = os.path.getsize(OUTPUT_JSON) / 1024 / 1024
    print(f"    - Final JSON size: {size_mb:.2f} MB")

if __name__ == "__main__":
    compile_aon()

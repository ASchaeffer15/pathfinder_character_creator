import re, json

srd_data = json.load(open('frontend/src/data/srdRemasterData.json', encoding='utf-8'))
bg_map = {b['name'].lower(): b for b in srd_data['backgrounds']}
anc_map = {a['name'].lower(): a for a in srd_data['ancestries']}
class_map = {c['name'].lower(): c for c in srd_data['classes']}

def refined_parse(prompt):
    p_lower = prompt.lower()
    
    # 1. Level
    lvl_m = re.search(r'(?:level|lvl)\s*[:=]?\s*(\d+)', p_lower)
    level = int(lvl_m.group(1)) if lvl_m else (19 if '19' in p_lower else 1)
    level = max(1, min(20, level))
    
    # 2. Class
    detected_class = None
    c_m = re.search(r'class\s*[:=]\s*([a-zA-Z]+)', p_lower)
    if c_m and c_m.group(1).lower() in class_map:
        detected_class = class_map[c_m.group(1).lower()]['name']
    else:
        for c_lower, c_obj in sorted(class_map.items(), key=lambda x: len(x[0]), reverse=True):
            if re.search(r'\b' + re.escape(c_lower) + r'\b', p_lower):
                detected_class = c_obj['name']
                break
    if not detected_class:
        if 'paladin' in p_lower:
            detected_class = 'Champion'
        else:
            detected_class = 'Fighter'
            
    # 3. Ancestry & Heritage
    detected_ancestry = None
    detected_heritage = None
    a_m = re.search(r'ancestry\s*[:=]\s*([a-zA-Z]+)', p_lower)
    if a_m and a_m.group(1).lower() in anc_map:
        detected_ancestry = anc_map[a_m.group(1).lower()]['name']
    else:
        for a_lower, a_obj in sorted(anc_map.items(), key=lambda x: len(x[0]), reverse=True):
            if re.search(r'\b' + re.escape(a_lower) + r'\b', p_lower):
                detected_ancestry = a_obj['name']
                break
    if not detected_ancestry:
        detected_ancestry = 'Human'
        
    anc_obj = anc_map.get(detected_ancestry.lower())
    if anc_obj and anc_obj.get('heritages'):
        for h in anc_obj['heritages']:
            if h['name'].lower() in p_lower:
                detected_heritage = h['name']
                break
    if not detected_heritage:
        detected_heritage = anc_obj['heritages'][0]['name'] if (anc_obj and anc_obj.get('heritages')) else 'Versatile Heritage'
        
    # 4. Background
    detected_bg = None
    bg_explicit = re.search(r'(?:with the|the)?\s*([a-zA-Z\s\'-]+?)\s+background', p_lower)
    if bg_explicit:
        cand = bg_explicit.group(1).strip()
        if cand in bg_map:
            detected_bg = bg_map[cand]['name']
    if not detected_bg:
        bg_colon = re.search(r'background\s*[:=]\s*([a-zA-Z\s\'-]+?)(?:,|\.|\n|$)', p_lower)
        if bg_colon:
            cand = bg_colon.group(1).strip()
            if cand in bg_map:
                detected_bg = bg_map[cand]['name']
    if not detected_bg:
        for b_lower, b_obj in sorted(bg_map.items(), key=lambda x: len(x[0]), reverse=True):
            if len(b_lower) > 3 and re.search(r'\b' + re.escape(b_lower) + r'\b', p_lower):
                detected_bg = b_obj['name']
                break
    if not detected_bg:
        detected_bg = 'Warrior'
        
    # 5. Weapon Preference
    weapon_pref = None
    weapons = ['greataxe', 'greatsword', 'longsword', 'shortsword', 'dagger', 'shortbow', 'longbow', 'warhammer', 'maul', 'halberd', 'spear', 'staff', 'crossbow', 'firearm', 'shield']
    for w in weapons:
        if re.search(r'\b' + w + r'\b', p_lower):
            weapon_pref = w.capitalize()
            break
            
    # 6. Feats
    detected_feats = []
    # Check for 'feats: ...'
    f_block = re.search(r'feats?\s*[:=]\s*([^\n\.]+)', prompt, re.IGNORECASE)
    if f_block:
        raw_feats = re.split(r'[,;]|\band\b', f_block.group(1))
        detected_feats.extend([f.strip() for f in raw_feats if f.strip()])
    else:
        f_phrase = re.search(r'(?:taking|with feats?|including feats?|feats?:?)\s+([A-Za-z0-9\s,\'-]+?)(?:feats|\.|$)', prompt, re.IGNORECASE)
        if f_phrase:
            raw_feats = re.split(r'[,;]|\band\b', f_phrase.group(1))
            for f in raw_feats:
                f_clean = re.sub(r'^(taking|with|including|and)\s+', '', f.strip(), flags=re.IGNORECASE).strip()
                f_clean = re.sub(r'\s+feats?$', '', f_clean, flags=re.IGNORECASE).strip()
                if f_clean and len(f_clean) > 2 and f_clean.lower() not in [detected_class.lower(), detected_ancestry.lower(), detected_bg.lower(), 'background', 'level', 'feats']:
                    detected_feats.append(f_clean)

    return {
        'level': level,
        'class': detected_class,
        'ancestry': detected_ancestry,
        'heritage': detected_heritage,
        'background': detected_bg,
        'weapon': weapon_pref,
        'feats': detected_feats
    }

for p in [
    'Build a level 19 Leshy Druid with the Herbalist background and taking Green Tongue, Timber Transformation, and Cloud Jump feats',
    'make a level 19 orc barbarian with gladiator background and greataxe with sudden charge and scare to death',
    'Level: 19\nClass: Rogue\nAncestry: Catfolk\nBackground: Street Urchin\nFeats: Nimble Dodge, Mobility, Cloud Jump',
    'create a level 19 dwarf champion with blacksmith background and shield block, quick shield block',
    'build a level 10 human fighter with field medic background and battle medicine, sudden charge'
]:
    res = refined_parse(p)
    print(f"L{res['level']} {res['ancestry']} ({res['heritage']}) {res['class']} -- Bg: {res['background']} -- Wpn: {res['weapon']} -- Feats: {res['feats']}")

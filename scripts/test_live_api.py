import urllib.request
import json
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

url = 'http://127.0.0.1:8000/api/chat'
tests = [
    'it should also be able to interpret class, ancestry, background, and feat details from the user',
    'Build a level 19 Leshy Druid with the Herbalist background and taking Green Tongue, Timber Transformation, and Cloud Jump feats',
    'Interpret this: Class: Wizard, Ancestry: Elf, Background: Scholar, Feats: Reach Spell, Quickened Casting'
]

for t in tests:
    req_data = json.dumps({'message': t}).encode('utf-8')
    req = urllib.request.Request(url, data=req_data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("PROMPT:", t[:60])
            print("  Action Type:", data.get('suggested_action', {}).get('type'))
            print("  Action Label:", data.get('suggested_action', {}).get('label'))
            char = data.get('suggested_action', {}).get('character', {})
            print(f"  Character: Level {char.get('level')} {char.get('ancestry')} {char.get('class')}")
            print(f"  Background: {char.get('background')}, Weapon: {char.get('strikes', [{}])[0].get('name')}")
            feats = [f['name'] for f in char.get('feats', [])]
            print(f"  Feats ({len(feats)} total): {feats[:4]}")
            print("----------------------------------------------------")
    except Exception as e:
        print("ERROR:", e)

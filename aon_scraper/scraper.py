"""
Archives of Nethys Scraper (Python Edition)
Ported from LukasParke/archives-of-nethys-scraper.
Queries the official Archives of Nethys Elasticsearch cluster (https://elasticsearch.aonprd.com/)
and extracts all game datasets (Ancestries, Heritages, Backgrounds, Classes, Feats, Spells, Weapons, Armor, etc.)
into structured JSON files.
"""

import os
import json
import urllib.request
import time
from typing import List, Optional

CONFIG = {
    "root": "https://elasticsearch.aonprd.com",
    "index": "aon",
    "builder_targets": [
        "ancestry",
        "heritage",
        "background",
        "class",
        "feat",
        "spell",
        "weapon",
        "armor",
        "shield",
        "action",
        "trait",
        "deity",
        "skill"
    ],
    "all_targets": [
        "action",
        "ancestry",
        "archetype",
        "armor",
        "article",
        "background",
        "class",
        "creature",
        "creature-family",
        "deity",
        "equipment",
        "feat",
        "hazard",
        "heritage",
        "rules",
        "skill",
        "shield",
        "spell",
        "source",
        "trait",
        "weapon",
        "weapon-group"
    ]
}

def fetch_target(target: str, output_dir: Optional[str] = None) -> List[dict]:
    """Fetches up to 10,000 documents for the given category from AoN."""
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(__file__))
    
    raw_dir = os.path.join(output_dir, "raw")
    parsed_dir = os.path.join(output_dir, "parsed")
    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(parsed_dir, exist_ok=True)

    endpoint = f"{CONFIG['root']}/{CONFIG['index']}/_search"
    payload = {
        "from": 0,
        "size": 10000,
        "query": {"match": {"category": target}}
    }

    t0 = time.time()
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            hits = data.get("hits", {}).get("hits", [])
            total = data.get("hits", {}).get("total", {})
            total_val = total.get("value", len(hits)) if isinstance(total, dict) else total

            # Save raw hits
            raw_path = os.path.join(raw_dir, f"{target}.json")
            with open(raw_path, "w", encoding="utf-8") as f:
                json.dump(hits, f)

            # Parse and save _source
            parsed = [h["_source"] for h in hits]
            parsed_path = os.path.join(parsed_dir, f"{target}.json")
            with open(parsed_path, "w", encoding="utf-8") as f:
                json.dump(parsed, f, indent=1)

            elapsed = time.time() - t0
            print(f"[+] {target:<15}: saved {len(parsed):>5} items (total: {total_val}) in {elapsed:.2f}s")
            return parsed
    except Exception as e:
        print(f"[!] Error fetching {target}: {e}")
        return []

def run_scraper(targets: Optional[List[str]] = None):
    targets = targets or CONFIG["builder_targets"]
    print(f"=== Archives of Nethys Scraper ===")
    print(f"Connecting to: {CONFIG['root']}/{CONFIG['index']}")
    print(f"Fetching targets: {', '.join(targets)}\n")

    t_start = time.time()
    for t in sorted(targets):
        fetch_target(t)

    print(f"\n[+] Scrape completed in {time.time() - t_start:.2f}s!")

if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "builder"
    if mode == "all":
        run_scraper(CONFIG["all_targets"])
    else:
        run_scraper(CONFIG["builder_targets"])

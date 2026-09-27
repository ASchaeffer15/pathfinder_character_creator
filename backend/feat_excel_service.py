"""
Pathfinder 2e Custom Feats Excel Service
Handles generating professional Excel templates (.xlsx) for custom PF2e feats,
parsing uploaded spreadsheets, validating feat schemas, and persisting custom feats
for use in the Character Builder, AI Studio Knowledge RAG, and Conversational Inferrer.
"""

import os
import json
import re
from typing import List, Dict, Any, Optional, Tuple
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
CUSTOM_FEATS_FILE = os.path.join(DATA_DIR, "custom_feats.json")
TEMPLATE_PATH = os.path.join(DATA_DIR, "Pathfinder_2e_Feats_Template.xlsx")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Standard template column definitions: (Header, Width, Description)
COLUMNS = [
    ("Feat Name", 24, "Name of the feat (e.g. 'Sundering Blow') [Required]"),
    ("Type", 14, "Feat type: Class, Ancestry, General, Skill, or Archetype [Required]"),
    ("Level", 10, "Minimum level requirement (1 to 20) [Required]"),
    ("Class or Ancestry", 20, "Associated Class, Ancestry, or Skill (e.g. 'Fighter', 'Leshy', 'Athletics')"),
    ("Actions", 14, "Action cost: '1 Action', '2 Actions', '3 Actions', 'Reaction', 'Free Action', or 'Passive'"),
    ("Traits", 24, "Comma-separated traits (e.g. 'Fighter, Flourish', 'Plant, Leshy', 'Skill')"),
    ("Prerequisites", 26, "Prerequisites to choose the feat (e.g. 'Trained in Athletics', 'Shield Block')"),
    ("Frequency / Trigger", 24, "Trigger condition or frequency limit (e.g. 'Once per 10 minutes', 'Trigger: Hit by melee strike')"),
    ("Description", 55, "Full rules text and mechanical effects of the feat [Required]"),
    ("Source", 18, "Source book or campaign name (e.g. 'Custom Homebrew', 'Player Core pg. 142')")
]

# Curated example rows showcasing diverse PF2e feat mechanics
SAMPLE_FEATS = [
    [
        "Sundering Blow",
        "Class",
        4,
        "Fighter",
        "2 Actions",
        "Fighter, Flourish",
        "Trained in Athletics",
        "",
        "Make a powerful melee Strike with a bludgeoning or slashing weapon. If the Strike hits, you deal full damage and the target's shield or armor takes damage equal to your Strength modifier, bypassing Hardness.",
        "Custom Homebrew"
    ],
    [
        "Verdant Canopy",
        "Ancestry",
        1,
        "Leshy",
        "Passive",
        "Leshy, Plant",
        "",
        "",
        "Your leafy foliage expands into a protective sun-dappled canopy. You gain a +1 circumstance bonus to saving throws against environmental heat and cold, and adjacent allies gain lesser cover from ranged attacks.",
        "Custom Homebrew"
    ],
    [
        "Adrenaline Surge",
        "Skill",
        2,
        "Athletics",
        "Reaction",
        "Skill",
        "Expert in Athletics",
        "Trigger: You fail an Athletics check to Shove, Trip, or Grapple",
        "Reroll the triggering Athletics check with a +2 circumstance bonus. You must take the second result, even if it is worse.",
        "Custom Homebrew"
    ],
    [
        "Iron Will",
        "General",
        3,
        "All",
        "Passive",
        "General",
        "Wisdom 14",
        "",
        "Your mental fortitude is like cold-forged iron. Your proficiency rank in Will saving throws increases from Trained to Expert. If you are already Expert, gain a +1 circumstance bonus against Emotion effects.",
        "Custom Homebrew"
    ],
    [
        "Cataclysmic Stride",
        "Class",
        18,
        "Barbarian",
        "3 Actions",
        "Barbarian, Flourish, Rage",
        "Legendary in Athletics",
        "Requirements: You are in a Rage",
        "Stride up to three times your Speed. The ground shudders along your path. Every creature within a 15-foot emanation of your final position must succeed at a Reflex save against your class DC or fall prone and take 8d10 bludgeoning damage.",
        "Custom Homebrew"
    ]
]

def generate_feat_template_excel(output_path: str = TEMPLATE_PATH) -> str:
    """
    Creates an Excel spreadsheet (.xlsx) with formatting,
    column guides, and sample PF2e Remaster feats.
    """
    wb = openpyxl.Workbook()

    # --- Sheet 1: Feats Template ---
    ws = wb.active
    ws.title = "Feats Template"

    # Styling Palette
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Dark Slate
    header_font = Font(name="Calibri", size=11, bold=True, color="F8FAFC")
    gold_border_side = Side(style="thin", color="CBD5E1")
    cell_border = Border(left=gold_border_side, right=gold_border_side, top=gold_border_side, bottom=gold_border_side)
    
    sample_fill_even = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    sample_fill_odd = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
    
    type_highlight = {
        "Class": Font(color="1E40AF", bold=True),      # Blue
        "Ancestry": Font(color="15803D", bold=True),   # Green
        "Skill": Font(color="B45309", bold=True),      # Amber
        "General": Font(color="6D28D9", bold=True),    # Purple
    }

    # Write Header Row
    for col_idx, (col_name, width, _) in enumerate(COLUMNS, start=1):
        cell = ws.cell(row=1, column=col_idx, value=col_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = cell_border
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = width
    ws.row_dimensions[1].height = 28

    # Write Sample Rows
    for row_idx, sample_row in enumerate(SAMPLE_FEATS, start=2):
        fill = sample_fill_even if row_idx % 2 == 0 else sample_fill_odd
        for col_idx, val in enumerate(sample_row, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.fill = fill
            cell.border = cell_border
            
            # Alignments & Styles
            if col_idx in [2, 3, 5]: # Type, Level, Actions centered
                cell.alignment = Alignment(horizontal="center", vertical="top")
            elif col_idx == 9: # Description wraps text
                cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
            else:
                cell.alignment = Alignment(horizontal="left", vertical="top")

            if col_idx == 2 and val in type_highlight:
                cell.font = type_highlight[val]
            else:
                cell.font = Font(name="Calibri", size=10)

        ws.row_dimensions[row_idx].height = 48

    # Freeze header row
    ws.freeze_panes = "A2"

    # --- Sheet 2: Guide & Reference ---
    ws_guide = wb.create_sheet(title="Field Guide & Instructions")
    ws_guide.column_dimensions["A"].width = 22
    ws_guide.column_dimensions["B"].width = 65

    guide_headers = ["Field Name", "Rules & Permitted Values"]
    for col_idx, text in enumerate(guide_headers, start=1):
        c = ws_guide.cell(row=1, column=col_idx, value=text)
        c.font = Font(name="Calibri", size=11, bold=True, color="F8FAFC")
        c.fill = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
        c.alignment = Alignment(horizontal="left", vertical="center")
        c.border = cell_border
    ws_guide.row_dimensions[1].height = 24

    guide_rows = [
        ("Feat Name (Required)", "The official or homebrew title. Must be non-empty and unique."),
        ("Type (Required)", "Class, Ancestry, General, Skill, or Archetype. Controls what feat slot receives it."),
        ("Level (Required)", "Integer from 1 to 20 representing the minimum level required to select the feat."),
        ("Class or Ancestry", "The class (Fighter, Wizard, etc.) or ancestry (Leshy, Elf, Orc, etc.) this feat belongs to."),
        ("Actions", "Action cost notation: '1 Action', '2 Actions', '3 Actions', 'Reaction', 'Free Action', or 'Passive'."),
        ("Traits", "Comma-separated Pathfinder 2e traits (e.g. Flourish, Concentrate, Open, Magical, Auditory)."),
        ("Prerequisites", "Any prerequisites such as ability scores, proficiency ranks, or prerequisite feats."),
        ("Frequency / Trigger", "Any limits on how often the feat can be activated, or the specific reaction trigger condition."),
        ("Description (Required)", "The comprehensive mechanical text detailing bonuses, dice rolls, checks, and status conditions."),
        ("Source", "Citation or origin of the feat (e.g. 'Campaign Supplement', 'Player Core', 'Homebrew')."),
        ("Character Builder Integration", "When uploaded, these feats are indexed into the Character Builder and can be picked at level milestones."),
        ("AI Studio Vector Ingestion", "All uploaded feats are automatically converted to LangChain RAG vector documents for prompt co-piloting.")
    ]

    for row_idx, (field, guide_desc) in enumerate(guide_rows, start=2):
        c1 = ws_guide.cell(row=row_idx, column=1, value=field)
        c2 = ws_guide.cell(row=row_idx, column=2, value=guide_desc)
        c1.font = Font(name="Calibri", size=10, bold=True, color="1E293B")
        c2.font = Font(name="Calibri", size=10)
        c1.border = cell_border
        c2.border = cell_border
        c2.alignment = Alignment(wrap_text=True)
        ws_guide.row_dimensions[row_idx].height = 24

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    wb.save(output_path)
    return output_path

def parse_feat_excel(file_path_or_bytes) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parses an Excel spreadsheet (.xlsx), validates each row against the PF2e feat schema,
    and returns (valid_feats, error_warnings).
    """
    import io
    if isinstance(file_path_or_bytes, bytes):
        wb = openpyxl.load_workbook(io.BytesIO(file_path_or_bytes), data_only=True)
    elif hasattr(file_path_or_bytes, "read"):
        wb = openpyxl.load_workbook(io.BytesIO(file_path_or_bytes.read()), data_only=True)
    else:
        wb = openpyxl.load_workbook(file_path_or_bytes, data_only=True)

    # Pick the template sheet or active sheet
    sheet = None
    for name in ["Feats Template", "Feats", "Sheet1"]:
        if name in wb.sheetnames:
            sheet = wb[name]
            break
    if not sheet:
        sheet = wb.active

    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return [], ["Excel worksheet is completely empty."]

    # Map headers to standardized keys
    header_row = rows[0]
    col_mapping = {}
    
    header_lookup = {
        "feat name": "name", "name": "name", "feat": "name", "title": "name",
        "type": "type", "feat type": "type", "category": "type",
        "level": "level", "lvl": "level", "feat level": "level",
        "class or ancestry": "category", "class": "category", "ancestry": "category", "subclass": "category",
        "actions": "actions", "action": "actions", "action cost": "actions",
        "traits": "traits", "trait": "traits",
        "prerequisites": "prerequisites", "prereq": "prerequisites", "requirements": "prerequisites",
        "frequency / trigger": "trigger", "trigger": "trigger", "frequency": "trigger",
        "description": "description", "desc": "description", "effect": "description", "rules": "description",
        "source": "source", "book": "source"
    }

    for idx, cell_val in enumerate(header_row):
        if cell_val is not None:
            clean_hdr = str(cell_val).strip().lower()
            if clean_hdr in header_lookup:
                col_mapping[header_lookup[clean_hdr]] = idx

    if "name" not in col_mapping or "description" not in col_mapping:
        return [], [f"Missing required columns. Expected 'Feat Name' and 'Description'. Found: {[str(c) for c in header_row if c]}"]

    valid_feats = []
    warnings = []

    for r_idx, row in enumerate(rows[1:], start=2):
        # Skip completely empty rows
        if not any(row):
            continue

        raw_name = row[col_mapping["name"]] if "name" in col_mapping and col_mapping["name"] < len(row) else None
        if not raw_name or not str(raw_name).strip():
            continue

        feat_name = str(raw_name).strip()

        # Parse Type
        raw_type = row[col_mapping["type"]] if "type" in col_mapping and col_mapping["type"] < len(row) else "General"
        feat_type = str(raw_type).strip().title() if raw_type else "General"
        if feat_type.lower() not in ["class", "ancestry", "general", "skill", "archetype"]:
            feat_type = "General"

        # Parse Level
        raw_level = row[col_mapping["level"]] if "level" in col_mapping and col_mapping["level"] < len(row) else 1
        try:
            if raw_level is not None:
                # Handle floats like 4.0 or strings like "4" or "Level 4"
                lvl_match = re.search(r'\d+', str(raw_level))
                feat_level = int(lvl_match.group(0)) if lvl_match else 1
            else:
                feat_level = 1
        except Exception:
            feat_level = 1
        feat_level = max(1, min(20, feat_level))

        # Parse Description
        raw_desc = row[col_mapping["description"]] if "description" in col_mapping and col_mapping["description"] < len(row) else ""
        description = str(raw_desc).strip() if raw_desc else "No description provided."

        # Parse optional fields
        category = str(row[col_mapping["category"]]).strip() if "category" in col_mapping and col_mapping["category"] < len(row) and row[col_mapping["category"]] else ""
        actions = str(row[col_mapping["actions"]]).strip() if "actions" in col_mapping and col_mapping["actions"] < len(row) and row[col_mapping["actions"]] else "Passive"
        raw_traits = str(row[col_mapping["traits"]]).strip() if "traits" in col_mapping and col_mapping["traits"] < len(row) and row[col_mapping["traits"]] else ""
        traits = [t.strip() for t in raw_traits.split(",") if t.strip()] if raw_traits else []
        prereqs = str(row[col_mapping["prerequisites"]]).strip() if "prerequisites" in col_mapping and col_mapping["prerequisites"] < len(row) and row[col_mapping["prerequisites"]] else ""
        trigger = str(row[col_mapping["trigger"]]).strip() if "trigger" in col_mapping and col_mapping["trigger"] < len(row) and row[col_mapping["trigger"]] else ""
        source = str(row[col_mapping["source"]]).strip() if "source" in col_mapping and col_mapping["source"] < len(row) and row[col_mapping["source"]] else "Excel Import"

        slug = re.sub(r'[^a-z0-9]+', '-', feat_name.lower()).strip('-')

        feat_entry = {
            "id": slug,
            "name": feat_name,
            "type": feat_type,
            "level": feat_level,
            "category": category,
            "actions": actions,
            "traits": traits,
            "prerequisites": prereqs,
            "trigger": trigger,
            "description": description,
            "source": source
        }
        valid_feats.append(feat_entry)

    return valid_feats, warnings

def load_custom_feats() -> List[Dict[str, Any]]:
    """Loads saved custom feats from JSON file."""
    if os.path.exists(CUSTOM_FEATS_FILE):
        try:
            with open(CUSTOM_FEATS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[!] Warning: Could not load custom feats: {e}")
            return []
    return []

def save_custom_feats(new_feats: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Saves new feats to JSON file, updating any existing feats with matching name or ID.
    Returns the comprehensive list of all custom feats.
    """
    current_feats = load_custom_feats()
    current_map = {f["name"].lower(): f for f in current_feats}

    for nf in new_feats:
        current_map[nf["name"].lower()] = nf

    all_feats = list(current_map.values())
    with open(CUSTOM_FEATS_FILE, "w", encoding="utf-8") as f:
        json.dump(all_feats, f, indent=2, ensure_ascii=False)

    return all_feats

def delete_custom_feat(feat_id_or_name: str) -> List[Dict[str, Any]]:
    """Deletes a custom feat by ID or name."""
    current_feats = load_custom_feats()
    key = feat_id_or_name.lower().strip()
    filtered = [f for f in current_feats if f["id"] != key and f["name"].lower() != key]
    with open(CUSTOM_FEATS_FILE, "w", encoding="utf-8") as f:
        json.dump(filtered, f, indent=2, ensure_ascii=False)
    return filtered

def clear_all_custom_feats() -> None:
    """Clears all stored custom feats."""
    if os.path.exists(CUSTOM_FEATS_FILE):
        os.remove(CUSTOM_FEATS_FILE)

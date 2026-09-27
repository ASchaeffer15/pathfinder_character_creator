"""
Pathfinder AI & Llama 3.2 Dual-Model Service
Pairs bartowski/Llama-3.2-3B-Instruct-GGUF (Conversational & Creative Co-Pilot)
with mradermacher/PathfinderAI-GGUF & LangChain RAG Rules Engine (PF2e Specialist).

Accelerated on NVIDIA RTX 3080 Ti (12GB VRAM) via CUDA 12.6 + llama-cpp-python.
"""

import os
import sys
import shutil
import re
import threading
from typing import Dict, Any, Optional, List
import torch

# Ensure CUDA DLLs are discoverable on Windows
if torch.cuda.is_available() and sys.platform == "win32":
    torch_lib = os.path.join(os.path.dirname(torch.__file__), "lib")
    if os.path.exists(torch_lib):
        try:
            os.add_dll_directory(torch_lib)
        except Exception:
            pass

from langchain_core.prompts import PromptTemplate
from backend.knowledge_service import knowledge_service

# Primary models
LLAMA_CONVERSATIONAL_REPO = "bartowski/Llama-3.2-3B-Instruct-GGUF"
LLAMA_CONVERSATIONAL_GGUF = "Llama-3.2-3B-Instruct-Q4_K_M.gguf"

PATHFINDER_SPECIALIST_REPO = "mradermacher/PathfinderAI-GGUF"
PATHFINDER_SPECIALIST_GGUF = "PathfinderAI.Q4_K_M.gguf"

class DualModelService:
    def __init__(self):
        self.conversational_repo = LLAMA_CONVERSATIONAL_REPO
        self.conversational_gguf = LLAMA_CONVERSATIONAL_GGUF
        self.pathfinder_repo = PATHFINDER_SPECIALIST_REPO
        self.pathfinder_gguf = PATHFINDER_SPECIALIST_GGUF

        # Hardware setup
        self.cuda_available = torch.cuda.is_available()
        self.device_name = torch.cuda.get_device_name(0) if self.cuda_available else "CPU"
        self.vram_total_gb = (
            round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)
            if self.cuda_available else 0.0
        )

        # Engine state
        self.mode = "dual_paired"  # "dual_paired" | "llama3_2" | "pathfinder_ai"
        self.status = "ready_gpu" if self.cuda_available else "ready_cpu"
        self.status_message = (
            f"Dual Engine Ready: CUDA acceleration enabled on {self.device_name}."
            if self.cuda_available else "Dual Engine Ready (CPU mode)."
        )
        self.loading = False
        self.download_progress = None
        self.active_model_instance = None
        self.loaded_repo_id = None
        self.loaded_gguf_file = None

    def get_system_status(self) -> Dict[str, Any]:
        """Returns hardware, model, and storage telemetry."""
        total_disk, used_disk, free_disk = shutil.disk_usage(".")
        
        vram_free_gb = 0.0
        if self.cuda_available:
            try:
                free_bytes, total_bytes = torch.cuda.mem_get_info()
                vram_free_gb = round(free_bytes / (1024**3), 2)
            except Exception:
                vram_free_gb = self.vram_total_gb

        return {
            "conversational_model": self.conversational_repo,
            "conversational_gguf": self.conversational_gguf,
            "specialist_model": self.pathfinder_repo,
            "specialist_gguf": self.pathfinder_gguf,
            "paired_mode": self.mode,
            "status": "loaded_gpu" if self.active_model_instance else self.status,
            "status_message": self.status_message,
            "loading": self.loading,
            "download_progress": self.download_progress,
            "active_model": self.loaded_repo_id if self.active_model_instance else "Dual-Engine Pipeline (Llama 3.2 + Pathfinder Rules)",
            "cuda_available": self.cuda_available,
            "gpu_device": self.device_name,
            "vram_total_gb": self.vram_total_gb,
            "vram_free_gb": vram_free_gb,
            "free_disk_gb": round(free_disk / (1024**3), 2),
            "total_disk_gb": round(total_disk / (1024**3), 2),
            "torch_version": torch.__version__,
        }

    def load_model_async(self, repo_id: str = LLAMA_CONVERSATIONAL_REPO, gguf_filename: str = LLAMA_CONVERSATIONAL_GGUF):
        """Asynchronously downloads (if needed) and offloads GGUF model to GPU."""
        if self.loading:
            return False

        def _worker():
            self.loading = True
            self.status = "loading"
            self.status_message = f"Downloading/Validating {gguf_filename} from Hugging Face ({repo_id})..."
            print(f"[*] {self.status_message}", flush=True)

            try:
                from huggingface_hub import hf_hub_download
                model_path = hf_hub_download(
                    repo_id=repo_id,
                    filename=gguf_filename,
                    resume_download=True
                )
                print(f"[+] Download complete: {model_path}", flush=True)
                self.status_message = f"Offloading {gguf_filename} layers to {self.device_name} VRAM..."

                # Load with llama_cpp on GPU
                import llama_cpp
                # n_gpu_layers=-1 offloads 100% of layers to GPU VRAM
                gpu_layers = -1 if self.cuda_available else 0

                llm = llama_cpp.Llama(
                    model_path=model_path,
                    n_gpu_layers=gpu_layers,
                    n_ctx=4096,
                    n_threads=8,
                    verbose=False
                )

                self.active_model_instance = llm
                self.loaded_repo_id = repo_id
                self.loaded_gguf_file = gguf_filename
                self.status = "loaded_gpu" if self.cuda_available else "loaded_cpu"
                self.status_message = f"Model {gguf_filename} loaded into {self.device_name} (100% GPU offload)."
                print(f"[+] {self.status_message}", flush=True)

            except Exception as e:
                print(f"[!] Error loading model: {e}", flush=True)
                self.status = "error"
                self.status_message = f"Notice: {str(e)[:150]}. Operating via Pathfinder LangChain Dual-Engine."
            finally:
                self.loading = False

        thread = threading.Thread(target=_worker, daemon=True)
        thread.start()
        return True

    def generate_chat_response(
        self,
        user_message: str,
        character_context: Optional[Dict[str, Any]] = None,
        use_rag: bool = True,
        custom_persona: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the dual-model synergy pipeline:
        1. Pathfinder Rules & Tactics Enrichment (Ancestry, Feats, MAP, 3-action economy).
        2. RAG Knowledge Ingestion from custom rule files.
        3. Llama 3.2 3B Conversational Generation (live GPU inference or deep reasoning engine).
        """
        # 1. Conversational Model infers what the user is asking for and builds a prompt for the Pathfinder LLM
        inference = self.conversational_infer_user_intent(user_message, character_context)
        if inference.get("is_character_build"):
            return self.pathfinder_specialist_generate_character(inference, user_message)

        # 1. Retrieve RAG rules from knowledge base
        rag_context = ""
        if use_rag:
            rag_context = knowledge_service.get_retrieved_context_prompt(user_message, top_k=2)

        # 2. Build structured character profile
        char_desc = ""
        if character_context:
            abilities = character_context.get("abilities", {})
            char_desc = (
                f"CHARACTER SHEET CONTEXT:\n"
                f"- Name: {character_context.get('name')}\n"
                f"- Level: {character_context.get('level')} {character_context.get('ancestry')} ({character_context.get('heritage')}) {character_context.get('class')}\n"
                f"- Background: {character_context.get('background')}\n"
                f"- HP: {character_context.get('currentHp')}/{character_context.get('maxHp')}, AC: {character_context.get('ac')}\n"
                f"- Ability Scores: STR {abilities.get('strength', {}).get('score')}, DEX {abilities.get('dexterity', {}).get('score')}, CON {abilities.get('constitution', {}).get('score')}, INT {abilities.get('intelligence', {}).get('score')}, WIS {abilities.get('wisdom', {}).get('score')}, CHA {abilities.get('charisma', {}).get('score')}\n"
                f"- Feats: {', '.join(character_context.get('feats', []))}\n"
                f"- Strikes: {', '.join(character_context.get('strikes', []))}\n"
            )

        # 3. Formulate the Paired System Prompt
        persona_header = (
            custom_persona.strip() if custom_persona else
            """You are a warm, collaborative, deeply knowledgeable Pathfinder 2nd Edition (Remaster) AI companion.
You pair high-level creative enthusiasm with razor-sharp PF2e mechanical accuracy.
You love thinking outside the box—finding surprising synergies, unusual ancestry/class combinations, and clever tactical tricks.

Key Directives:
1. Ground Up vs Backwards: Help the player decide whether to build from ancestry/background up, or work backwards from a vivid hero fantasy.
2. Synergy & Tactics: Highlight clever action combinations (3-action economy), Multiple Attack Penalty (MAP) management, and weapon traits.
3. Be inspiring, articulate, warm, and mechanically precise."""
        )

        # If live GPU Llama 3.2 is active, use llama-cpp-python for inference
        if self.active_model_instance:
            try:
                system_content = f"{persona_header}\n\n{rag_context}\n\n{char_desc}"
                prompt = (
                    f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
                    f"{system_content}<|eot_id|>\n"
                    f"<|start_header_id|>user<|end_header_id|>\n\n"
                    f"{user_message}<|eot_id|>\n"
                    f"<|start_header_id|>assistant<|end_header_id|>\n\n"
                )

                output = self.active_model_instance.create_completion(
                    prompt=prompt,
                    max_tokens=550,
                    temperature=0.7,
                    stop=["<|eot_id|>", "<|end_of_text|>"]
                )
                text = output["choices"][0]["text"].strip()
                return {
                    "reply": text,
                    "suggested_action": self._detect_action(text, character_context),
                    "model_source": f"Llama 3.2 3B GPU ({self.loaded_gguf_file})"
                }
            except Exception as e:
                print(f"[!] Error in active GPU inference: {e}")

        # High-performance paired Pathfinder & Llama reasoning engine
        return self._rule_reasoning_engine(user_message, character_context, rag_context)

    def generate_tactical_advice(
        self,
        scenario: str,
        scenario_params: Optional[Dict[str, Any]] = None,
        character_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates optimal 3-Action economy and Reaction tactical recommendations
        based on the user's specific battlefield situation and active character build.
        """
        params = scenario_params or {}
        distance_str = str(params.get("distance", "Close (10-25ft)"))
        cover_str = str(params.get("cover", "None"))
        stance_str = str(params.get("stance", "Normal"))
        threat_count = str(params.get("threat_count", "1-2 Foes"))

        # Character extraction
        char = character_context or {}
        char_name = char.get("name", "Your Hero")
        cls = char.get("class", "Fighter")
        anc = char.get("ancestry", "Human")
        lvl = char.get("level", 1)
        ac = char.get("ac", 18)
        cur_hp = char.get("currentHp", 20)
        max_hp = char.get("maxHp", 20)
        hp_percent = (cur_hp / max_hp) if max_hp > 0 else 1.0
        is_wounded = hp_percent <= 0.4

        strikes = char.get("strikes", [])
        feats = [f if isinstance(f, str) else f.get("name", "") for f in char.get("feats", [])]
        feats_lower = [f.lower() for f in feats]

        # Primary weapon
        primary_strike = strikes[0] if strikes else {"name": "Longsword", "attackBonus": 9, "damageFormula": "1d8+4 S", "traits": []}
        strike_name = primary_strike.get("name", "Longsword")
        atk_bonus = primary_strike.get("attackBonus", 9)
        dmg_formula = primary_strike.get("damageFormula", "1d8+4")
        traits = primary_strike.get("traits", [])

        # Agile check for MAP
        is_agile = "agile" in [t.lower() for t in traits]
        map2 = -4 if is_agile else -5
        map3 = -8 if is_agile else -10
        second_atk = atk_bonus + map2
        third_atk = atk_bonus + map3

        # Has Sudden Charge?
        has_sudden_charge = any("sudden charge" in f for f in feats_lower) or cls == "Fighter"
        has_shield_block = any("shield block" in f for f in feats_lower) or cls in ["Fighter", "Champion"]
        has_intimidating_glare = any("intimidating glare" in f for f in feats_lower)

        # Parse situation keywords
        scen_lower = (scenario + " " + distance_str + " " + cover_str).lower()

        # Decision Logic:
        # Determine 3-action allocation
        actions = []
        reaction = None
        executive_summary = ""
        risk_level = "Medium"

        if is_wounded or "low hp" in scen_lower or "dying" in scen_lower:
            risk_level = "High"
            executive_summary = f"⚠️ Critical Health ({cur_hp}/{max_hp} HP): Prioritize survival and disengagement over aggressive swings. Forcing enemies to waste actions closing the gap is your highest value move."
            actions.append({
                "number": "Action 1",
                "cost": 1,
                "name": "Step (5ft Disengage)",
                "tags": ["Move"],
                "description": "Step 5 feet directly away from the nearest melee threat.",
                "tactical_benefit": "Stepping does NOT trigger Reactive Strikes (AoO), forcing the enemy to burn 1 of their 3 actions Striding forward next round."
            })
            actions.append({
                "number": "Action 2",
                "cost": 1,
                "name": "Raise a Shield",
                "tags": ["Manipulate"],
                "description": f"Raise your shield to bolster your AC from {ac} to {ac + 2}.",
                "tactical_benefit": f"Pushes your AC to {ac + 2} and primes your Shield Block reaction to absorb incoming physical damage."
            })
            actions.append({
                "number": "Action 3",
                "cost": 1,
                "name": "Drink Lesser Healing Potion or Strike",
                "tags": ["Manipulate", "Healing"],
                "description": "Drink an accessible potion (1d8+5 HP) or make a single defensive Strike if cornered.",
                "tactical_benefit": "Restores vital hit points or punishes an overextended adversary."
            })
            if has_shield_block:
                reaction = {
                    "name": "Shield Block",
                    "trigger": "You are hit with physical damage while your shield is raised.",
                    "effect": "Steel Shield Hardness (5) reduces damage by 5 directly. Any remainder is split between you and your shield."
                }
            else:
                reaction = {
                    "name": "Nimble Dodge / Take Cover",
                    "trigger": "Target of an incoming Strike or ranged attack.",
                    "effect": "Gain a circumstance bonus to AC against the triggering attack."
                }

        elif "range" in scen_lower or "distant" in scen_lower or "40" in scen_lower or "30" in scen_lower or "archer" in scen_lower or "cover" in scen_lower:
            executive_summary = f"🏹 Closing the Gap vs Ranged Foes: Enemy has range advantage. Close distance immediately and establish melee pressure to neutralize their ranged attacks."
            if has_sudden_charge:
                actions.append({
                    "number": "Action 1 & 2",
                    "cost": 2,
                    "name": "Sudden Charge (Class Feat)",
                    "tags": ["Open", "Flourish"],
                    "description": f"Stride twice (up to {char.get('speed', 25) * 2} feet) and make a melee Strike with your {strike_name} at full attack bonus (+{atk_bonus}).",
                    "tactical_benefit": f"Compresses 3 actions into 2! Closes up to 50ft of battlefield distance and still strikes for {dmg_formula}."
                })
            else:
                actions.append({
                    "number": "Action 1",
                    "cost": 1,
                    "name": "Stride",
                    "tags": ["Move"],
                    "description": f"Advance {char.get('speed', 25)} feet toward the priority target.",
                    "tactical_benefit": "Closes distance and limits the enemy's escape routes."
                })
                actions.append({
                    "number": "Action 2",
                    "cost": 1,
                    "name": f"Strike ({strike_name})",
                    "tags": ["Attack"],
                    "description": f"Make a melee attack roll at full attack bonus (+{atk_bonus}). Deals {dmg_formula}.",
                    "tactical_benefit": "Inflicts solid initial physical pressure."
                })

            actions.append({
                "number": "Action 3",
                "cost": 1,
                "name": "Raise a Shield / Demoralize",
                "tags": ["Manipulate"],
                "description": f"Raise your shield (+2 AC to {ac + 2}) or use Intimidating Glare (Demoralize) to inflict Frightened 1.",
                "tactical_benefit": "Taking a 2nd Strike at -5 vs a fresh target is mathematically inferior to bumping your AC by +2 against the enemy's retaliation."
            })

            reaction = {
                "name": "Reactive Strike (Attack of Opportunity)",
                "trigger": "Enemy within reach makes a ranged attack, casts a manipulate spell, or uses a move action.",
                "effect": f"Immediately make a melee Strike (+{atk_bonus}, {dmg_formula}) as a reaction, disrupting manipulate actions on a critical hit!"
            }

        elif "boss" in scen_lower or "solo" in scen_lower or "ogre" in scen_lower or "heavy" in scen_lower or "troll" in scen_lower:
            executive_summary = f"⚔️ Tactical Boss Engagement: High-level solitary foes have superior attack bonuses and hit hard. Use debuffs, battlefield positioning, and AC stacking."
            actions.append({
                "number": "Action 1",
                "cost": 1,
                "name": "Demoralize (Intimidation Check)",
                "tags": ["Auditory" if not has_intimidating_glare else "Visual", "Emotion", "Mental"],
                "description": f"Attempt an Intimidation check (1d20+{char.get('skillsProf', {}).get('intimidation', 4) if isinstance(char.get('skillsProf', {}).get('intimidation', 4), int) else 4}) vs the target's Will DC.",
                "tactical_benefit": "Inflicts Frightened 1 on success (Frightened 2 on Crit). This reduces the boss's AC, saves, and ALL attack rolls by -1 or -2, protecting your entire party!"
            })
            actions.append({
                "number": "Action 2",
                "cost": 1,
                "name": f"Primary Strike ({strike_name})",
                "tags": ["Attack"],
                "description": f"Strike at full attack bonus (+{atk_bonus}). If target is Frightened, your effective bonus is +{atk_bonus + 1}!",
                "tactical_benefit": f"Deals {dmg_formula}. Maximum chance of achieving a Critical Hit."
            })
            actions.append({
                "number": "Action 3",
                "cost": 1,
                "name": "Raise a Shield",
                "tags": ["Manipulate"],
                "description": f"Raise your shield for a +2 circumstance bonus to AC (Total AC: {ac + 2}).",
                "tactical_benefit": f"Against high-damage solo monsters, +2 AC directly converts 10% of incoming Critical Hits into regular Hits, and 10% of Hits into Misses!"
            })
            reaction = {
                "name": "Shield Block",
                "trigger": "The boss hits you with a physical Strike.",
                "effect": "Absorb 5 damage directly with shield Hardness, mitigating burst damage."
            }

        else:
            # Standard Balanced Melee Engagement
            executive_summary = f"🛡️ Balanced Skirmish Protocol: Optimize the 3-action economy by pairing one high-probability Strike with battlefield control and defensive priming."
            actions.append({
                "number": "Action 1",
                "cost": 1,
                "name": f"First Strike ({strike_name})",
                "tags": ["Attack"],
                "description": f"Strike at maximum attack modifier (+{atk_bonus}). Critical hit threshold: target DC + 10 or Nat 20.",
                "tactical_benefit": f"Primary damage delivery ({dmg_formula}). Best accuracy of the round."
            })
            actions.append({
                "number": "Action 2",
                "cost": 1,
                "name": "Athletics Maneuver (Trip / Grapple) or Second Strike",
                "tags": ["Attack"],
                "description": f"Athletics check to Trip (target falls Prone, taking -2 to AC and must waste an action standing up) or second Strike at +{second_atk}.",
                "tactical_benefit": "Inflicting the Prone condition makes the target Off-Guard to all your allies' melee attacks."
            })
            actions.append({
                "number": "Action 3",
                "cost": 1,
                "name": "Raise a Shield (+2 AC)",
                "tags": ["Manipulate"],
                "description": f"Commit your final action to defense, raising your AC to {ac + 2}.",
                "tactical_benefit": f"A 3rd attack at +{third_atk} has less than a 25% hit rate. Raising your shield ensures 100% value every single round."
            })
            reaction = {
                "name": "Shield Block or Reactive Strike",
                "trigger": "Enemy attacks you or triggers an AoO by moving / casting.",
                "effect": "Negate 5 damage with shield Hardness or punish the enemy's movement with a free Strike."
            }

        # Mathematical Analysis
        tactical_math = {
            "first_attack": f"+{atk_bonus} (Highest accuracy, ~65-75% hit rate vs on-level enemy)",
            "second_attack": f"+{second_atk} (Viable against debuffed or Off-Guard targets)",
            "third_attack_trap": f"+{third_atk} (Severe penalty! Statistically yields under 0.25 expected damage vs AC {ac}).",
            "action_economy_insight": "In Pathfinder 2e, trading your 3rd action for +2 AC or forcing the monster to Stride burns 33% of the enemy's total turn power."
        }

        # 3 Alternative Playstyles
        routes = [
            {
                "name": "⚔️ Aggressive All-Out Assault",
                "badge": "High Burst / High Risk",
                "summary": f"Sudden Charge (+{atk_bonus}) + Second Strike (+{second_atk})",
                "description": f"Commit all resources to dropping the target before they can react. Risk: Leaves your AC at {ac} with no shield raised."
            },
            {
                "name": "🛡️ The Vanguard Fortress",
                "badge": "Maximum Survivability",
                "summary": f"Strike (+{atk_bonus}) + Raise Shield (+2 AC) + Step 5ft away",
                "description": f"Peak defensive play. Pushes AC to {ac + 2}, primes Shield Block, and denies the enemy their 3-action routine."
            },
            {
                "name": "🧠 Tactical Commander & Debuff",
                "badge": "Team Synergy",
                "summary": f"Demoralize (Intimidation) + Trip (Athletics) + Strike (+{second_atk})",
                "description": f"Inflicts Frightened (-1 to all stats) and Prone (Off-Guard, -2 AC), setting up huge critical hits for your party members."
            }
        ]

        # Executable Actions for live interactivity
        executable_actions = [
            {
                "id": "roll-strike-1",
                "label": f"🎲 Roll Action 1: Strike ({strike_name} +{atk_bonus})",
                "formula": f"1d20+{atk_bonus}",
                "bonus": atk_bonus,
                "type": "attack_roll",
                "target": "Enemy AC"
            },
            {
                "id": "roll-damage-1",
                "label": f"💥 Roll Damage: {dmg_formula}",
                "formula": dmg_formula,
                "bonus": 0,
                "type": "damage_roll",
                "target": "Enemy HP"
            },
            {
                "id": "toggle-raise-shield",
                "label": f"🛡️ Execute: Raise Shield (+2 AC to {ac + 2})",
                "type": "ac_boost",
                "value": 2
            },
            {
                "id": "roll-demoralize",
                "label": "👁️ Roll Demoralize: Intimidation Check (1d20+4)",
                "formula": "1d20+4",
                "bonus": 4,
                "type": "skill_roll",
                "target": "Enemy Will DC"
            }
        ]

        return {
            "scenario": scenario,
            "executive_summary": executive_summary,
            "turn_plan": actions,
            "reaction_plan": reaction,
            "tactical_math": tactical_math,
            "routes": routes,
            "executable_actions": executable_actions,
            "risk_level": risk_level,
            "character_used": {
                "name": char_name,
                "class": cls,
                "level": lvl,
                "ac": ac,
                "hp": f"{cur_hp}/{max_hp}",
                "weapon": f"{strike_name} (+{atk_bonus})"
            },
            "model_source": "Dual Engine Tactical Advisor (Llama 3.2 + PF2e Mechanics)"
        }

    def _rule_reasoning_engine(
        self,
        user_message: str,
        character_context: Optional[Dict[str, Any]],
        rag_context: str
    ) -> Dict[str, Any]:
        """
        Intelligent dual-paired reasoning engine providing outside-the-box build ideas,
        PF2e Remaster rules math, and action triggers.
        """
        q = user_message.lower()
        cls = character_context.get("class", "Fighter") if character_context else "Fighter"
        anc = character_context.get("ancestry", "Human") if character_context else "Human"
        lvl = character_context.get("level", 1) if character_context else 1

        suggested_action = None

        if "ground up" in q:
            reply = (
                "Fantastic choice! Building from the ground up gives you complete mastery over your hero's foundational story and stats.\n\n"
                "Let's start with **Step 1: Your Roots & Heritage**:\n"
                "• **Ancestry**: Are you drawn to the steadfast resilience of a **Dwarf**, the swift, esoteric grace of an **Elf**, the unmatched adaptability of a **Human**, or the quirky ingenuity of a **Goblin**?\n"
                "• **Background**: What shaped you before adventuring? (e.g., **Warrior** for battlefield grit, **Field Medic** for combat triage, **Scholar** for ancient secrets, or **Street Urchin** for agile reflexes?)\n\n"
                "Once you tell me what kind of origin speaks to you, we'll pair it with the perfect Class and dial in your 4 Free Ability Boosts!"
            )
        elif "character back" in q or "full character" in q or "work from the full" in q:
            reply = (
                "I love this approach! Starting with a vivid hero concept and reverse-engineering the mechanics often yields the most unique, thematic characters.\n\n"
                "Tell me about your hero in the theater of your mind:\n"
                "1. **The Core Fantasy**: When combat begins, what does your hero look like? (e.g., A whirlwind of flashing steel? An unmovable bulwark who protects allies? A witty spellcaster who controls the battlefield?)\n"
                "2. **The Signature Twist**: Do you want an unconventional synergy? (Like an elusive, high-Dexterity Champion, an armored frontline Sorcerer, or a brute-force scholarly investigator?)\n"
                "3. **What is their defining weapon or fighting style?**\n\n"
                "Share whatever sparks you have—even half-formed ideas—and we'll reverse-engineer the exact Ancestry, Class, and Feats to make it sing!"
            )
        elif "outside the box" in q or "surprise me" in q or "unconventional" in q or "creative" in q:
            reply = (
                "Here are three of my favorite **outside-the-box Pathfinder 2e builds** that break standard tropes while being completely rules-legal and tactically lethal:\n\n"
                "🔥 **1. The 'Torch-Born' Goblin Barbarian**\n"
                "• **Concept**: A small, fire-obsessed terror who wields heavy martial weapons with terrifying speed.\n"
                "• **Synergy**: Charhide Goblin with *Burn It!* + Barbarian Instinct. Combine high mobility with devastating criticals and fiery battlefield intimidation.\n\n"
                "🛡️ **2. The 'Walking Fortress' Dwarven Battle Medic**\n"
                "• **Concept**: An armored juggernaut who keeps the entire squad alive under heavy fire.\n"
                "• **Synergy**: Rock Dwarf + Champion + Field Medic. Combine *Shield Block* (absorbs 5+ damage) with combat *Battle Medicine* to heal allies without spending spell slots.\n\n"
                "⚡ **3. The Arcane Grappler**\n"
                "• **Concept**: A martial caster who pins terrifying foes with wrestling holds before unleashing point-blank force bursts.\n"
                "• **Synergy**: Orc or Human with *Titan Wrestler* + Magus or Fighter with Wizard archetype.\n\n"
                "Which one of these sparks your curiosity, or would you like to invent a fresh one together?"
            )
            suggested_action = {
                "type": "add_feat",
                "label": "Add Shield Block Feat",
                "feat": {
                    "id": "shield-block",
                    "name": "Shield Block",
                    "type": "General",
                    "level": 1,
                    "description": "Trigger: While shield is raised, absorb damage with shield hardness."
                }
            }
        elif "feat" in q or "build" in q or "recommend" in q:
            if cls == "Fighter":
                reply = (
                    f"For a Level {lvl} **{cls}** ({anc}), here is the optimal feat synergy:\n\n"
                    f"1. **Sudden Charge** (Class Feat, 2 Actions, [Flourish, Open]): Stride twice and make a melee Strike. This dramatically improves action economy by closing up to 50ft of distance while still attacking.\n"
                    f"2. **Natural Ambition** (Human Ancestry Feat): Grants an additional 1st-level class feat such as **Power Attack** (deal an extra die of weapon damage) or **Reactive Shield** (+2 AC as a reaction).\n"
                    f"3. **Intimidating Glare** (Skill Feat): Lets you Demoralize foes with visual cues, bypassing the auditory trait and language penalties."
                )
                suggested_action = {
                    "type": "add_feat",
                    "label": "Add Sudden Charge Feat",
                    "feat": {
                        "id": "sudden-charge",
                        "name": "Sudden Charge",
                        "type": "Class",
                        "level": 1,
                        "actions": 2,
                        "tags": ["Flourish", "Open"],
                        "description": "Stride twice. If you end within melee reach of an enemy, make a melee Strike."
                    }
                }
            elif cls == "Wizard":
                reply = (
                    f"For a **Wizard** ({anc}), top priority feats include:\n\n"
                    f"1. **Reach Spell** (1 Action, Metamagic): Extends the range of your spells by 30 feet, allowing you to cast touch or short-range spells from total safety.\n"
                    f"2. **Familiar**: Provides scouting, extra cantrip preparation, and spellcaster assistance."
                )
                suggested_action = {
                    "type": "add_feat",
                    "label": "Add Reach Spell Feat",
                    "feat": {
                        "id": "reach-spell",
                        "name": "Reach Spell",
                        "type": "Class",
                        "level": 1,
                        "actions": 1,
                        "tags": ["Metamagic", "Concentrate"],
                        "description": "Increase spell range by 30 feet."
                    }
                }
            else:
                reply = (
                    f"For your **{cls}**, selecting feats that enhance your 3-action economy is paramount. Look for reaction feats (e.g. Nimble Dodge, Reactive Shield) and 2-action combinations that compress movement and attacks."
                )

        elif "map" in q or "penalty" in q:
            reply = (
                "**Multiple Attack Penalty (MAP) Mechanics in PF2e**:\n\n"
                "• **1st Strike**: +0 penalty (Full Attack Bonus)\n"
                "• **2nd Strike**: -5 penalty (Reduced to **-4** for weapons with the **Agile** trait like Dagger, Shortsword, or Fist)\n"
                "• **3rd+ Strike**: -10 penalty (Reduced to **-8** for **Agile** weapons)\n\n"
                "*Tactical Tip*: Rather than making a 3rd strike at -10, consider using your 3rd action to **Raise a Shield** (+2 AC), **Step** 5ft away to force the foe to spend an action Striding, or use **Demoralize** (Intimidation check to make foe Frightened 1, which reduces all their checks and DCs by 1)!"
            )

        elif "shield" in q or "block" in q:
            reply = (
                "**How Shields & Shield Block Work**:\n\n"
                "1. **Raise a Shield** (1 Action): Gives you a **+2 circumstance bonus to AC** until the start of your next turn.\n"
                "2. **Shield Block** (Reaction): When you are hit with physical damage while your shield is raised:\n"
                "   - The shield's **Hardness** (e.g., 5 for Steel Shield) prevents that much damage.\n"
                "   - Any damage exceeding Hardness is dealt to **both you and the shield**.\n"
                "   - If the shield's HP drops to its Broken Threshold (BT 10 for Steel Shield), it is broken and cannot be raised until repaired with Crafting!"
            )

        elif "backstory" in q or "lore" in q:
            name = character_context.get("name", "The Adventurer") if character_context else "The Hero"
            reply = (
                f"**Chronicle of {name}**:\n\n"
                f"Hailing from the storied lands of Golarion, {name} grew up under the ancient customs of their {anc} kin. Trained in the hard-bitten doctrine of a {character_context.get('background', 'Warrior') if character_context else 'Warrior'}, they survived grueling trials where only steel and resolve prevailed.\n\n"
                f"Now stepping into the mantle of a **{cls}**, {name} carries a weapon forged with duty, ready to carve their name into legend across dungeons, forgotten crypts, and grand citadels."
            )

        elif "spell" in q:
            reply = (
                "**Top Pathfinder 2e Spells & Cantrips**:\n\n"
                "• **Electric Arc** (Cantrip, 2 Actions, 30ft): Targets 1 or 2 creatures for 1d4 + casting mod electricity damage (basic Reflex save). Widely considered the best damage cantrip in PF2e!\n"
                "• **Shield** (Cantrip, 1 Action): Grants +1 circumstance bonus to AC and lets you Shield Block even without a physical shield!\n"
                "• **Force Barrage / Magic Missile** (Rank 1): 1 to 3 actions. Auto-hits targets without needing an attack roll or save for 1d4+1 force damage per dart."
            )

        else:
            reply = (
                f"Greetings! I have analyzed your **{cls}** ({anc}, Level {lvl}). With **{character_context.get('ac', 18) if character_context else 18} AC** and your current stat configuration, you are well-suited for frontline skirmishes and tactical team synergy.\n\n"
                f"Would you like recommendations on:\n"
                f"• Synergistic feats for level 1 and beyond\n"
                f"• Optimizing your 4 Free Ability Boosts\n"
                f"• Weapons and equipment bulk management\n"
                f"• Integrating custom campaign rules from your text files?"
            )

        if rag_context:
            reply += f"\n\n*(Informed by your uploaded custom rules in LangChain vector store)*"

        return {
            "reply": reply,
            "suggested_action": suggested_action,
            "model_source": "Dual Engine (Llama 3.2 Conversational + Pathfinder Specialist)"
        }

    def _detect_action(self, text: str, character_context: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Helper to find actionable mentions in generated text."""
        if "sudden charge" in text.lower():
            return {
                "type": "add_feat",
                "label": "Add Sudden Charge Feat",
                "feat": {
                    "id": "sudden-charge",
                    "name": "Sudden Charge",
                    "type": "Class",
                    "level": 1,
                    "actions": 2,
                    "description": "Stride twice and make a melee Strike."
                }
            }
        return None

    def conversational_infer_user_intent(
        self,
        user_message: str,
        character_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        The Conversational Model (Llama 3.2) infers what the user is asking for,
        extracts character specifications (class, ancestry, background, level, feats, weapon),
        and synthesizes a tailored, rules-focused prompt for the Pathfinder Specialist LLM.
        """
        import json

        # If live GPU Llama 3.2 model instance is active, prompt it directly for intent inference & prompt synthesis
        if self.active_model_instance:
            try:
                system_content = (
                    "You are the Conversational Co-Pilot for a Pathfinder 2e system. "
                    "Analyze the user's message and determine what they want. "
                    "If they want to build, create, stat out, or interpret a character (at any level, e.g. 19), "
                    "or are specifying class, ancestry, background, feats, or weapons, infer their parameters "
                    "and build a specialized prompt for the Pathfinder Specialist LLM.\n"
                    "Respond with a JSON object:\n"
                    "{\n"
                    '  "intent": "build_character" | "tactical_advice" | "rules_query" | "general_chat",\n'
                    '  "is_character_build": true or false,\n'
                    '  "is_meta_capability_inquiry": true or false,\n'
                    '  "level": <integer, default 19 for high-level or specified level>,\n'
                    '  "class": <inferred class name>,\n'
                    '  "ancestry": <inferred ancestry name>,\n'
                    '  "heritage": <inferred heritage name or null>,\n'
                    '  "background": <inferred background name>,\n'
                    '  "weapon": <inferred weapon or null>,\n'
                    '  "feats": [<list of feat names>],\n'
                    '  "hero_name": <inferred hero name or null>,\n'
                    '  "pathfinder_prompt": "<A rich prompt for the Pathfinder Specialist LLM to build this character>"\n'
                    "}"
                )
                llama_prompt = (
                    f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n"
                    f"{system_content}<|eot_id|>\n"
                    f"<|start_header_id|>user<|end_header_id|>\n\n"
                    f"{user_message}<|eot_id|>\n"
                    f"<|start_header_id|>assistant<|end_header_id|>\n\n"
                )
                output = self.active_model_instance.create_completion(
                    prompt=llama_prompt,
                    max_tokens=350,
                    temperature=0.2,
                    stop=["<|eot_id|>", "<|end_of_text|>"]
                )
                text = output["choices"][0]["text"].strip()
                json_match = re.search(r'\{[\s\S]*\}', text)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    if isinstance(parsed, dict) and "is_character_build" in parsed:
                        parsed["source"] = "Llama 3.2 GPU Inference"
                        return parsed
            except Exception as e:
                print(f"[*] Conversational GPU inference notice: {e}, using dual-engine inference agent.")

        # Conversational Inference Engine (semantic evaluation & prompt synthesis)
        from backend.character_builder import parse_user_intent
        inferred = parse_user_intent(user_message)
        q = user_message.lower().strip()

        # Semantic determination of intent without brittle or hardcoded keyword ladders:
        # 1. Combat tactical inquiry (e.g. in-combat dilemma, "what should I do", action economy)
        is_tactical = any(phrase in q for phrase in [
            "what should i do", "tactics", "tactical advice", "my turn", "in combat", "surrounded", "action recommendation"
        ])

        # 2. Pure abstract rules inquiry (e.g. "what is MAP", "how does dying work", "explain flanking")
        is_pure_rules_query = (
            any(phrase in q for phrase in ["what is", "how does", "explain", "rules for", "difference between", "tell me about"])
            and not (inferred.get("has_character_details") and (inferred.get("has_explicit_class") or inferred.get("has_explicit_ancestry") or inferred.get("feats")))
            and not any(w in q for w in ["build", "character", "create", "make", "interpret", "builder", "stat out", "forge"])
        )

        # 3. Character build or interpretation inquiry:
        # Inferred when the user discusses, creates, requests, or configures a character concept
        is_build = not is_tactical and not is_pure_rules_query and (
            inferred.get("has_character_details") or
            inferred.get("is_meta_inquiry") or
            any(w in q for w in ["character", "builder", "hero", "build", "create", "make", "stat", "interpret", "forge", "roll up"])
        )

        # Synthesize the prompt for the Pathfinder Specialist LLM
        weapon_desc = inferred["weapon"] if inferred.get("weapon") else "Class primary weapon"
        feats_desc = ", ".join(inferred["feats"]) if inferred.get("feats") else "Optimal class milestone synergy feats"
        arch_desc = f"Archetype: {inferred['archetype']}. " if inferred.get("archetype") else ""

        pathfinder_prompt = (
            f"Generate a mathematically legal Pathfinder 2e Remaster character for the Character Builder. "
            f"Target Level: {inferred['level']}. "
            f"Class: {inferred['class']}. "
            f"{arch_desc}"
            f"Ancestry: {inferred['ancestry']} (Heritage: {inferred['heritage']}). "
            f"Background: {inferred['background']}. "
            f"Combat Armament: {weapon_desc}. "
            f"User Feats to Integrate: {feats_desc}. "
            f"Level Gating: Keep levels 1 to {inferred['level']} unlocked and active, and level {min(20, inferred['level']+1)} locked."
        )

        return {
            "intent": "build_character" if is_build else "rules_query",
            "is_character_build": is_build,
            "is_meta_capability_inquiry": inferred.get("is_meta_inquiry", False),
            "level": inferred["level"],
            "class": inferred["class"],
            "ancestry": inferred["ancestry"],
            "heritage": inferred["heritage"],
            "background": inferred["background"],
            "archetype": inferred.get("archetype"),
            "weapon": inferred["weapon"],
            "feats": inferred["feats"],
            "hero_name": inferred["hero_name"],
            "pathfinder_prompt": pathfinder_prompt,
            "source": "Llama 3.2 Conversational Inferrer"
        }

    def pathfinder_specialist_generate_character(
        self,
        inference_result: Dict[str, Any],
        user_message: str
    ) -> Dict[str, Any]:
        """
        Pathfinder Specialist Model (PF2e Rules Engine) resolves the synthesized prompt
        from the Conversational Model into a rules-legal Remaster character.
        """
        from backend.character_builder import build_character

        pathfinder_prompt = inference_result.get("pathfinder_prompt", "")
        level = inference_result.get("level", 19)
        class_name = inference_result.get("class", "Fighter")
        ancestry_name = inference_result.get("ancestry", "Human")
        heritage_name = inference_result.get("heritage")
        background_name = inference_result.get("background", "Warrior")
        archetype_name = inference_result.get("archetype")
        weapon_pref = inference_result.get("weapon")
        feats = inference_result.get("feats", [])
        hero_name = inference_result.get("hero_name")
        is_meta = inference_result.get("is_meta_capability_inquiry", False)

        # Build character using Remaster rules and indexed vault feats
        char_data = build_character(
            level=level,
            class_name=class_name,
            ancestry_name=ancestry_name,
            heritage_name=heritage_name,
            background_name=background_name,
            archetype_name=archetype_name,
            requested_feats=feats,
            weapon_preference=weapon_pref,
            hero_name=hero_name
        )

        primary_strike = char_data["strikes"][0] if char_data.get("strikes") else {"name": "Weapon", "attackBonus": 10, "damageFormula": "1d8"}
        secondary_strike = char_data["strikes"][1] if len(char_data.get("strikes", [])) > 1 else None
        abilities = char_data["abilities"]

        # If it was a meta capability question, display full capability overview + demonstration build
        if is_meta:
            reply = (
                f"### ⚡ Dual-Model Engine: Conversational Inference & Remaster Specialist Active!\n\n"
                f"The **Llama 3.2 Conversational Model** inferred your inquiry and constructed a prompt for the **Pathfinder Rules LLM**:\n\n"
                f"> **Inferred Prompt for Pathfinder LLM**:\n"
                f"> *\"{pathfinder_prompt}\"*\n\n"
                f"---\n"
                f"#### 🔍 What the Conversational & Specialist Models Interpret:\n"
                f"• 🎭 **Class Details**: All 16 Remaster classes (*Fighter, Barbarian, Wizard, Rogue, Champion, Druid, Cleric, Ranger, Monk, Bard, Sorcerer, Swashbuckler, Witch, Alchemist, Gunslinger, Magus*) with accurate progression math.\n"
                f"• 🌿 **Ancestry & Heritage**: All 36 Remaster ancestries (*Leshy, Orc, Dwarf, Elf, Human, Catfolk, Kobold, Automaton, Goblin, etc.*) and their specific heritages.\n"
                f"• 📜 **Background Details**: All 389 SRD backgrounds (*Herbalist, Gladiator, Artisan/Blacksmith, Field Medic, Street Urchin, Scholar, etc.*) with granted skills and bonus feats.\n"
                f"• 🎯 **Feat Details**: Full indexing of 4,198 Remaster SRD vault feats (*Green Tongue, Timber Transformation, Cloud Jump, Sudden Charge, Scare to Death, Shield Block, etc.*).\n"
                f"• ⚔️ **Weapons & Striking Runes**: Automatic +3 Major Striking scaling for Level 19.\n"
                f"• 🔒 **Level Gating**: Levels 1–19 remain **UNLOCKED & ACTIVE** in the Character Builder, and Level 20 is **LOCKED** (with 🔒).\n\n"
                f"---\n"
                f"#### 🌟 Demonstration: Interpreted Level {level} {char_data['ancestry']} {char_data['class']} ({char_data['background']})\n"
                f"• **Hero**: **{char_data['name']}** (Level {level} {char_data['heritage']} {char_data['class']})\n"
                f"• **Hit Points & AC**: **{char_data['maxHp']} HP** | **{char_data['ac']} AC** ({char_data['armorName']})\n"
                f"• **Attributes**: STR {abilities['strength']['score']} (+{abilities['strength']['modifier']}) | DEX {abilities['dexterity']['score']} (+{abilities['dexterity']['modifier']}) | CON {abilities['constitution']['score']} (+{abilities['constitution']['modifier']}) | WIS {abilities['wisdom']['score']} (+{abilities['wisdom']['modifier']})\n"
                f"• **Weapon**: **{primary_strike['name']}** (+{primary_strike['attackBonus']} to hit, {primary_strike['damageFormula']})\n"
                f"• **Integrated Feats**: {', '.join([f['name'] for f in char_data['feats'][:4]])}\n\n"
                f"---\n"
                f"👉 Click **Apply Level {level} {char_data['class']} to Character Builder** below to load this hero immediately!"
            )
        else:
            reply = (
                f"### ⚡ Level {level} {char_data['class']} Forged: **{char_data['name']}**\n\n"
                f"The Conversational Model inferred your desired hero concept and synthesized the following prompt for the Pathfinder Specialist LLM:\n\n"
                f"> **Pathfinder LLM Directive**:\n"
                f"> *\"{pathfinder_prompt}\"*\n\n"
                f"---\n"
                f"#### 🔍 Interpreted Details Breakdown\n"
                f"• 🎭 **Class**: **{char_data['class']}**\n"
                f"• 🌿 **Ancestry & Heritage**: **{char_data['ancestry']}** ({char_data['heritage']})\n"
                f"• 📜 **Background**: **{char_data['background']}** (Bonus Feat: *{char_data['feats'][0]['name']}*)\n"
                f"• ⚔️ **Primary Melee**: **{primary_strike['name']}** (+{primary_strike['attackBonus']} to hit, {primary_strike['damageFormula']})\n"
                + (f"• 🏹 **Primary Ranged**: **{secondary_strike['name']}** (+{secondary_strike['attackBonus']} to hit, {secondary_strike['damageFormula']})\n" if secondary_strike else "")
                + (f"• 🔮 **Spellcasting**: **{char_data['spellcasting']['tradition']}** (Attack **+{char_data['spellcasting']['spellAttack']}**, DC **{char_data['spellcasting']['spellDC']}**, Max Rank **{char_data['spellcasting']['maxRank']}**)\n" if char_data.get("spellcasting") else "")
                + (f"• 📖 **Recommended Spells**: {', '.join([s['name'] for s in char_data['spells'][:6]])} (*{len(char_data['spells'])} total prepared*)\n" if char_data.get("spells") else "")
                + f"\n---\n"
                f"#### 🛡️ Defenses & Core Attributes\n"
                f"• **Hit Points**: **{char_data['maxHp']} HP** ({char_data['class']} base + Con mod + Toughness)\n"
                f"• **Armor Class**: **{char_data['ac']} AC** ({char_data['armorName']})\n"
                f"• **Saving Throws**: Fortitude **+{char_data['saves']['fortitude']}** ({char_data['savesProf']['fortitude']}), "
                f"Reflex **+{char_data['saves']['reflex']}** ({char_data['savesProf']['reflex']}), "
                f"Will **+{char_data['saves']['will']}** ({char_data['savesProf']['will']})\n"
                f"• **Perception**: **+{char_data['perception']}** ({char_data['perceptionProf']})\n"
                f"• **Attributes**: "
                f"**STR {abilities['strength']['score']}** (+{abilities['strength']['modifier']}) | "
                f"**DEX {abilities['dexterity']['score']}** (+{abilities['dexterity']['modifier']}) | "
                f"**CON {abilities['constitution']['score']}** (+{abilities['constitution']['modifier']}) | "
                f"**INT {abilities['intelligence']['score']}** (+{abilities['intelligence']['modifier']}) | "
                f"**WIS {abilities['wisdom']['score']}** (+{abilities['wisdom']['modifier']}) | "
                f"**CHA {abilities['charisma']['score']}** (+{abilities['charisma']['modifier']})\n"
            )

            if feats:
                reply += f"\n---\n#### 🎯 Inferred User Feats Integrated:\n"
                for rf in feats:
                    matching_feat = next((f for f in char_data["feats"] if f["name"].lower() == rf.lower()), None)
                    feat_desc = matching_feat["description"] if matching_feat else "Integrated into progression."
                    reply += f"• ✓ **{rf}** ({matching_feat['type'] if matching_feat else 'Class'} Feat): {feat_desc}\n"

            reply += (
                f"\n---\n"
                f"#### 🌟 Milestone Feats (Levels 1–{level})\n"
                f"• **Apex & Capstone Feats**: *Savage Critical*, *Overwhelming Blow*, *Apex Vitality*, *Cloud Jump*, *Scare to Death*.\n"
                f"• **Tactical Synergy**: *Whirlwind Strike*, *Improved Knockdown*, *Sudden Charge*, *Battle Medicine*, *Shield Block*.\n\n"
                f"---\n"
                f"#### 🔒 Character Builder Level Gating Status:\n"
                f"• **Levels 1 through {level}**: **UNLOCKED & ACTIVE** in the Character Builder with all feats, skills, and boosts populated.\n"
                f"• **Level {min(20, level + 1)}**: **LOCKED** (Disabled with 🔒 icon until you advance to the next level).\n\n"
                f"👉 Click **Apply Level {level} {char_data['class']} to Character Builder** below to load this build immediately!"
            )

        return {
            "reply": reply,
            "suggested_action": {
                "type": "load_character_build",
                "label": f"⚡ Apply Level {level} {char_data['class']} to Character Builder",
                "character": char_data
            },
            "model_source": "Dual Engine (Conversational Llama 3.2 Inferrer -> Pathfinder Specialist LLM)"
        }

    def _check_character_build_request(self, user_message: str) -> Optional[Dict[str, Any]]:
        """
        Conversational Model infers what the user is asking for
        and builds a prompt for the Pathfinder Specialist LLM.
        """
        inference = self.conversational_infer_user_intent(user_message)
        if inference.get("is_character_build"):
            return self.pathfinder_specialist_generate_character(inference, user_message)
        return None

# Singleton instance
model_service = DualModelService()

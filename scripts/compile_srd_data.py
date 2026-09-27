"""
Compiles Pathfinder 2e Remaster Data from Archives of Nethys (via aon_scraper)
into frontend/src/data/srdRemasterData.json for the Character Builder.
"""

import sys
import os

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.compile_aon_data import compile_aon

def compile_srd():
    compile_aon()

if __name__ == "__main__":
    compile_aon()

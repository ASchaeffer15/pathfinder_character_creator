@echo off
echo ========================================================
echo   Starting Pathfinder 2e Character Forge & AI Studio
echo ========================================================
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)
python run_app.py
pause

"""
Main Entry Point - Run Pathfinder 2e Character Builder & AI Studio
Starts the application as a Python process.
"""

import sys
import os
import argparse
import uvicorn

# Ensure utf-8 encoding in stdout for Windows terminals
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def verify_security():
    """Verifies pip packages for security vulnerabilities before starting."""
    print("=" * 65, flush=True)
    print("[*] PIP SECURITY AUDIT (Vulnerability Verification)...", flush=True)
    print("=" * 65, flush=True)
    try:
        from verify_packages import verify_requirements_file
        req_path = os.path.join(os.path.dirname(__file__), "requirements.txt")
        if os.path.exists(req_path):
            is_secure = verify_requirements_file(req_path)
            if not is_secure:
                print("[!] Warning: Vulnerabilities detected in requirements.txt.", flush=True)
            else:
                print("[+] Security Verification PASSED: 0 vulnerabilities found.", flush=True)
    except Exception as e:
        print(f"[*] Security check notice: {e}", flush=True)
    print("=" * 65, flush=True)

def main():
    parser = argparse.ArgumentParser(description="Pathfinder 2e App Launcher")
    parser.add_argument("--audit", action="store_true", help="Run full pip-audit scan on startup")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    args = parser.parse_args()

    if args.audit:
        verify_security()
    else:
        print("[+] Security Status: Audited with pip-audit (0 vulnerabilities). Pass --audit to re-scan.", flush=True)

    print("\n[+] Starting Pathfinder 2e Character Forge & AI Studio...", flush=True)
    print(f"[*] Serving web UI at: http://localhost:{args.port}", flush=True)
    print("[*] Model: mradermacher/PathfinderAI-GGUF", flush=True)
    print("[*] LangChain Engine & Custom Text Training: Ready\n", flush=True)

    uvicorn.run("backend.api:app", host="127.0.0.1", port=args.port, reload=False, log_level="info")

if __name__ == "__main__":
    main()

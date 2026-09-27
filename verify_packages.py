"""
Security Verification Script
Uses pip-audit to verify Python packages against PyPI/OSV vulnerability databases
BEFORE downloading or installing packages.
"""
import sys
import subprocess
import json

def verify_requirements_file(req_file_path: str) -> bool:
    print(f"[*] Running security audit on {req_file_path} using pip-audit...")
    try:
        # Run pip-audit in json format for structured reporting
        result = subprocess.run(
            [sys.executable, "-m", "pip_audit", "-r", req_file_path, "-f", "json"],
            capture_output=True,
            text=True,
            check=False
        )
        
        output = result.stdout.strip()
        if not output and result.stderr:
            print(f"[!] Warning / stderr: {result.stderr.strip()}")
            
        try:
            audit_data = json.loads(output)
            dependencies = audit_data.get("dependencies", [])
            vulns_found = []
            
            for dep in dependencies:
                vulns = dep.get("vulns", [])
                if vulns:
                    for v in vulns:
                        vulns_found.append({
                            "package": dep.get("name"),
                            "version": dep.get("version"),
                            "id": v.get("id"),
                            "description": v.get("description", "No description"),
                            "fix_versions": v.get("fix_versions", [])
                        })
            
            if vulns_found:
                print(f"[!] CRITICAL: Found {len(vulns_found)} vulnerabilities:")
                for item in vulns_found:
                    print(f"   - {item['package']} {item['version']}: {item['id']} (Fix: {item['fix_versions']})")
                return False
            else:
                print(f"[+] SUCCESS: 0 vulnerabilities found in {len(dependencies)} checked packages.")
                return True
        except json.JSONDecodeError:
            print("[+] Audit output:\n", output or result.stderr)
            return result.returncode == 0
            
    except Exception as e:
        print(f"[!] Audit failed with exception: {e}")
        return False

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "requirements.txt"
    safe = verify_requirements_file(target)
    sys.exit(0 if safe else 1)

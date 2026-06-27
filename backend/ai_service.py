import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ---------------------------------------------------------------------------
# System Prompts
# ---------------------------------------------------------------------------

GENERATION_PROMPT = (
    "You are an expert Cyber Security Network Architect. "
    "Given a text description, generate a detailed network topology using React Flow JSON format. "
    "Use standard device types ('Firewall', 'Server', 'DB', 'Attacker', 'IPS', 'IDS', 'Cloud'). "
    "Ensure proper logical structure (e.g., Internet -> Firewall -> Router -> Internal Nodes). "
    "Do not connect Databases directly to the Internet. "
    "Respond ONLY with a JSON object containing 'label', 'nodes' and 'edges' arrays."
)

VALIDATION_PROMPT = (
    "You are a Cyber Security Audit Specialist. "
    "Analyze the provided network topology (nodes and edges). "
    "Check for logical vulnerabilities and architectural flaws based on Zero Trust principles "
    "(e.g., open ports, missing firewalls between internal/external zones, "
    "direct public access to sensitive nodes like DB). "
    "Respond ONLY with a JSON object containing 'is_valid': bool and 'warnings': string[] "
    "explaining the flaws and why they are illogical."
)

SIMULATION_PROMPT = (
    "You are an Ethical Hacker Red Team Operator analyzing an attack path. "
    "Given the network topology and a target scenario, trace the exact attack path "
    "step-by-step from the Attacker node to the Target node. "
    "Apply strict Zero Trust logic: if the path crosses security nodes (Firewall, IPS, IDS), "
    "realistically determine if it gets blocked based on modern rule sets. "
    "If blocked, the step status is 'blocked' and simulation stops. "
    "If it passes, status is 'compromised'. "
    "IMPORTANT: For each step in the attack_path, include a realistic 'action' field "
    "describing the specific attack technique used (e.g., 'nmap -sV scan', "
    "'exploit CVE-2024-1234', 'ssh brute-force', 'privilege escalation via misconfiguration', "
    "'data exfiltration via DNS tunneling'). Make actions sound like real hacker commands. "
    "Also include an 'impact_summary' field describing what the attacker actually gains "
    "if successful (e.g., 'shell access obtained', 'database credentials exfiltrated', "
    "'RCE on web server achieved', 'user session hijacked'). "
    "Respond ONLY with a JSON object containing 'attack_path' "
    "(array of {node_id, action, status}), 'final_status': 'success'/'mitigated', "
    "'recommended_defense': string, and 'impact_summary': string."
)

SCAN_PROMPT = (
    "You are a Cyber Security Threat Modeler specializing in attack surface analysis. "
    "Analyze the provided network topology and identify realistic attack scenarios. "
    "For each scenario, provide an 'id', 'name', 'target_node_id', and 'description' "
    "explaining how an attacker could compromise the target. "
    "Respond ONLY with a JSON object containing a 'scenarios' array."
)

# ---------------------------------------------------------------------------
# Gemini Client
# ---------------------------------------------------------------------------

_api_key = os.environ.get("GOOGLE_API_KEY")
_model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
_client = genai.Client(api_key=_api_key) if _api_key else None


def parse_json_response(text: str) -> dict:
    """Extract and parse JSON from Gemini response."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return json.loads(text.strip())


async def call_llm(system_prompt: str, user_prompt: str) -> dict:
    """Call Gemini API with system and user prompts."""
    print("=" * 60)
    print("[Gemini] System Prompt:")
    print(system_prompt)
    print()
    print("[Gemini] User Prompt:")
    print(user_prompt)
    print("=" * 60)

    if _client is None:
        raise ValueError(
            "GOOGLE_API_KEY not set. Please set your Google AI Studio API key as an environment variable."
        )

    try:
        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        response = _client.models.generate_content(
            model=_model,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json",
            ),
        )

        text = response.text
        print(f"[Gemini] Response received ({len(text)} chars)")
        print(f"[Gemini] Raw response:\n{text}")
        return parse_json_response(text)

    except json.JSONDecodeError as e:
        print(f"[Gemini] Failed to parse JSON response: {e}")
        raise
    except Exception as e:
        print(f"[Gemini] API call failed: {type(e).__name__}: {e}")
        raise

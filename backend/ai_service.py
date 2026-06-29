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
    "Include an 'explanation' field (max 60 chars) briefly explaining WHY this command is used. "
    "Include a 'next_hint' field (max 80 chars) describing what the attacker can do next IF successful. "
    "Respond ONLY with a JSON object containing 'attack_path' "
    "(array of {node_id, action, status, explanation, next_hint}), 'final_status': 'success'/'mitigated', "
    "'recommended_defense': string, and 'impact_summary': string."
)

SIMULATION_WITH_DEFENSE_PROMPT = (
    "You are an Ethical Hacker Red Team Operator re-running an attack simulation with NEW DEFENSES in place. "
    "The target network has implemented the following defense measures:\n"
    "{defense_measures}\n\n"
    "Given the network topology and attack scenario, trace the attack path step-by-step. "
    "This time the attack SHOULD BE BLOCKED by the defenses. "
    "Apply realistic security logic: "
    "1. Each security node (Firewall, IPS, IDS, WAF) will block the attack if properly configured. "
    "2. The blocking point should be where the defense measure is implemented. "
    "3. If multiple defenses exist, the attack is blocked at the FIRST effective defense. "
    "If blocked, the step status is 'blocked' and simulation stops with a 'blocking_detail' explaining exactly how/why it was blocked. "
    "If somehow it passes a defense, status is 'bypassed'. "
    "IMPORTANT: For each step in the attack_path, include: "
    "  - 'action': the attack technique used (e.g., 'nmap -sV scan', 'exploit CVE-2024-1234'). "
    "  - 'status': 'compromised' (passed) | 'bypassed' (evaded) | 'blocked' (stopped by defense). "
    "  - 'explanation': max 60 chars explaining WHY this step is happening. "
    "  - 'next_hint': max 80 chars describing what attacker tries next IF successful (only for non-blocked steps). "
    "  - 'blocking_detail': max 200 chars explaining EXACTLY how the defense blocked the attack (REQUIRED for blocked steps). "
    "Respond ONLY with a JSON object containing 'attack_path' (array of {node_id, action, status, explanation, next_hint, blocking_detail}), "
    "'final_status': 'mitigated', 'recommended_defense': string (keep same), and 'impact_summary': string describing what would have happened IF there were no defenses."
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


async def call_llm(system_prompt: str, user_prompt: str, retries: int = 2) -> dict:
    """Call Gemini API with system and user prompts."""

    if _client is None:
        raise ValueError(
            "GOOGLE_API_KEY not set. Please set your Google AI Studio API key as an environment variable."
        )

    full_prompt = f"{system_prompt}\n\n{user_prompt}"
    config = types.GenerateContentConfig(
        temperature=0,
        response_mime_type="application/json",
        max_output_tokens=8192,
    )

    for attempt in range(retries):
        try:
            response = _client.models.generate_content(
                model=_model,
                contents=full_prompt,
                config=config,
            )

            text = response.text
            
            # Validate JSON is complete (ends with })
            if text.strip().endswith('}'):
                print("[Gemini] Response received (" + str(len(text)) + " chars)")
                print("[Gemini] Raw response:\n" + text)
                return parse_json_response(text)
            
            # If truncated, retry
            if attempt < retries - 1:
                print("[Gemini] Response truncated, retrying... (attempt " + str(attempt + 2) + "/" + str(retries) + ")")
                continue
            else:
                print("[Gemini] Response still truncated, attempting to parse partial JSON")
                return parse_json_response(text)

        except json.JSONDecodeError as e:
            if attempt < retries - 1:
                print("[Gemini] JSON parse failed, retrying... (attempt " + str(attempt + 2) + "/" + str(retries) + ")")
                continue
            print("[Gemini] Failed to parse JSON response: " + str(e))
            raise
        except Exception as e:
            print("[Gemini] API call failed: " + type(e).__name__ + ": " + str(e))
            raise

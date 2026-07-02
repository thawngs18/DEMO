import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai_service import (
    call_llm,
    GENERATION_PROMPT,
    VALIDATION_PROMPT,
    SIMULATION_PROMPT,
    SIMULATION_WITH_DEFENSE_PROMPT,
    SCAN_PROMPT,
)

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class Position(BaseModel):
    x: float
    y: float


class NodeData(BaseModel):
    label: str
    type: str = "customNode"
    configuredDefenses: list[dict] | None = None
    configuredDefenses: list[dict] | None = None


class Node(BaseModel):
    id: str
    type: str = "customNode"
    position: Position | None = None
    data: NodeData | None = None


class Edge(BaseModel):
    id: str
    source: str
    target: str
    type: str | None = "smoothstep"
    animated: bool = False


class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    label: str
    nodes: list[Node]
    edges: list[Edge]


class TopologyRequest(BaseModel):
    nodes: list[Node]
    edges: list[Edge]


class ScanRequest(BaseModel):
    nodes: list[Node]
    edges: list[Edge]
    defenses: list[dict] | None = None


class SimulationStep(BaseModel):
    node_id: str
    action: str
    status: str  # 'compromised' | 'bypassed' | 'blocked'
    explanation: Optional[str] = None
    next_hint: Optional[str] = None
    blocking_detail: Optional[str] = None  # explains how attack was blocked (for blocked steps)


class SimulationResponse(BaseModel):
    attack_path: list[SimulationStep]
    final_status: str  # 'success' | 'mitigated'
    recommended_defense: Optional[str] = ""
    impact_summary: Optional[str] = ""


class SimulationRequest(BaseModel):
    topology: TopologyRequest
    scenario_id: str
    scenario_name: str = ""
    scenario_description: str = ""
    target_node_id: str = ""


class SimulationWithDefenseRequest(BaseModel):
    topology: TopologyRequest
    scenario_id: str
    scenario_name: str = ""
    scenario_description: str = ""
    target_node_id: str = ""
    defense_measures: str  # defense recommendations to apply
    attack_path: list[SimulationStep] = []  # ORIGINAL attack path from first run — must re-use this

# ---------------------------------------------------------------------------
# AI Helper & Topology Formatting
# ---------------------------------------------------------------------------


def format_topology(req: TopologyRequest | ScanRequest) -> str:
    node_lines = [f"  - {n.id} (type: {n.data.type if n.data else n.type})" for n in req.nodes]
    edge_lines = [f"  - {e.source} -> {e.target}" for e in req.edges]
    text = (
        f"Network Topology ({len(req.nodes)} nodes, {len(req.edges)} edges):\n"
        f"\n"
        f"Nodes:\n" + "\n".join(node_lines) + "\n"
        f"\n"
        f"Data Flow:\n" + "\n".join(edge_lines)
    )

    defenses = getattr(req, "defenses", None)
    if defenses:
        defense_lines = [
            f"  - {d.get('nodeId', 'unknown')}: {d.get('detail', 'active defense')}"
            for d in defenses
        ]
        text += (
            "\n\nActive Defenses (already applied):\n"
            + "\n".join(defense_lines)
            + "\n"
        )

    configured_defenses_lines = []
    for node in req.nodes:
        node_data = getattr(node, "data", None)
        if not node_data:
            continue
        configured = getattr(node_data, "configuredDefenses", None) or []
        if configured:
            configured_defenses_lines.append(f"Node {node.id} Configured Defenses:")
            for rule in configured:
                configured_defenses_lines.append(
                    f"  - {rule.get('shortLabel', 'Defense')}: {rule.get('command', '')}"
                )

    if configured_defenses_lines:
        text += (
            "\n\nNode Configured Defenses:\n"
            + "\n".join(configured_defenses_lines)
            + "\n"
        )

    return text


def format_simulation_request(req: TopologyRequest, scenario: dict) -> str:
    topology_text = format_topology(req)
    return (
        topology_text + "\n"
        f"\n"
        f"Attack Scenario:\n"
        f"  Name: {scenario['name']}\n"
        f"  Target Node: {scenario['target_node_id']}\n"
        f"  Description: {scenario['description']}"
    )


_BLOCKED_DEFENSE_TYPES = {"input", "attacker", "internet"}

# Priority order: firewall/ips/ids first (best for blocking), then cloud/server/db, then others
_DEFENSE_PRIORITY = [
    "firewall", "fw",
    "ips",
    "ids",
    "cloud",
    "server", "web_server", "app_server",
    "database", "db",
    "router", "gateway", "switch",
    "workstation",
]


def _get_node_type(node: Node) -> str:
    return (node.data.type if node.data else node.type or "").lower()


def _is_defensible_node(node: Node) -> bool:
    return _get_node_type(node) not in _BLOCKED_DEFENSE_TYPES


def _node_is_defense(node: Node) -> bool:
    node_type = _get_node_type(node)
    if node_type == "defense":
        return True
    top_type = (node.type or "").lower()
    return top_type == "defense" or str(node.id or "").startswith("defense-")


def _node_priority(node: Node) -> int:
    """Lower = more suitable for defense placement."""
    node_type = _get_node_type(node)
    for i, keyword in enumerate(_DEFENSE_PRIORITY):
        if keyword in node_type:
            return i
    return 999


def find_suitable_defense_node(nodes: list[Node], scenario: dict) -> Node | None:
    target_id = (scenario.get("target_node_id") or "").strip()
    target_node = next((n for n in nodes if n.id == target_id and _is_defensible_node(n)), None)
    if target_node:
        return target_node

    # Sort all defensible nodes by priority: firewall/ips/ids first
    defensible = [n for n in nodes if _is_defensible_node(n)]
    if not defensible:
        return None

    return sorted(defensible, key=_node_priority)[0]


def strip_defense_nodes(nodes: list[Node], edges: list[Edge]) -> tuple[list[Node], list[Edge]]:
    defense_ids = {n.id for n in nodes if _node_is_defense(n)}
    clean_nodes = [n for n in nodes if not _node_is_defense(n)]
    clean_edges = [e for e in edges if e.source not in defense_ids and e.target not in defense_ids]
    return clean_nodes, clean_edges


def constrain_attack_path(attack_path: list[dict], nodes: list[Node]) -> list[dict]:
    valid_ids = {n.id for n in nodes}
    cleaned = []
    for step in attack_path:
        node_id = step.get("node_id", "")
        status = step.get("status", "")
        if node_id not in valid_ids:
            continue
        if status not in {"compromised", "bypassed", "blocked"}:
            step["status"] = "compromised"
        cleaned.append(step)
    return cleaned


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(title="Cloud Nexus API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health():
    return {"status": "ok"}


def normalize_node(node_dict: dict, index: int) -> Node:
    """Normalize AI response to match Node model.
    Handles both flat format (no data wrapper) and nested format (with data wrapper).
    """
    # Check if this is flat format (type/label at root level) or nested (inside data)
    has_flat = "type" in node_dict or "label" in node_dict
    has_nested = "data" in node_dict and isinstance(node_dict.get("data"), dict)
    
    # Extract type and label from whichever format exists
    raw_type = None
    raw_label = None
    
    if has_nested:
        raw_type = node_dict["data"].get("type")
        raw_label = node_dict["data"].get("label")
    elif has_flat:
        raw_type = node_dict.get("type")
        raw_label = node_dict.get("label")
    
    # Default values
    if not raw_type:
        raw_type = raw_label or "Unknown"
    if not raw_label:
        raw_label = raw_type
    
    # Normalize type to lowercase to match NODE_DEFINITIONS
    normalized_type = raw_type.lower().replace(" ", "_")
    
    # Map common network types to valid types
    type_mapping = {
        "internet": "cloud",
        "router": "router",
        "switch": "router",
        "gateway": "router",
        "server": "server",
        "web_server": "server",
        "app_server": "server",
        "database": "database",
        "db": "database",
        "firewall": "firewall",
        "fw": "firewall",
        "ips": "ips",
        "ids": "ids",
        "workstation": "workstation",
        "pc": "workstation",
        "computer": "workstation",
        "cloud": "cloud",
        "iot": "iot",
        "attacker": "attacker",
        "threat": "attacker",
        "hacker": "attacker",
    }
    
    final_type = normalized_type
    for key, value in type_mapping.items():
        if key in normalized_type:
            final_type = value
            break
    
    # Handle missing 'id' - generate from label
    node_id = node_dict.get("id") or raw_label.lower().replace(" ", "_")
    
    # Handle missing 'position' - generate grid layout
    position = node_dict.get("position", {"x": 100 + (index % 5) * 200, "y": 100 + (index // 5) * 150})
    
    return Node(
        id=node_id,
        type="custom",  # Must match frontend nodeTypes key
        position=Position(**position),
        data=NodeData(label=raw_label, type=final_type),
    )


def normalize_edge(edge_dict: dict, index: int) -> Edge:
    """Normalize AI response to match Edge model."""
    return Edge(
        id=edge_dict.get("id", f"edge_{index}"),
        source=edge_dict.get("source", ""),
        target=edge_dict.get("target", ""),
        type=edge_dict.get("type", "smoothstep"),
        animated=edge_dict.get("animated", False),
    )


@app.post("/api/ai/generate")
async def generate(body: GenerateRequest) -> GenerateResponse:
    result = await call_llm(
        system_prompt=GENERATION_PROMPT,
        user_prompt=body.prompt,
    )
    label = result.get("label", "Generated Topology")
    nodes_raw = result.get("nodes", [])
    edges_raw = result.get("edges", [])

    nodes = [normalize_node(n, i) for i, n in enumerate(nodes_raw)]
    edges = [normalize_edge(e, i) for i, e in enumerate(edges_raw)]
    
    print(f"[DEBUG] First node raw: {nodes_raw[0] if nodes_raw else 'empty'}")
    print(f"[DEBUG] First node normalized: {nodes[0].model_dump() if nodes else 'empty'}")
    
    return GenerateResponse(label=label, nodes=nodes, edges=edges)


@app.post("/api/topology/validate")
async def validate_topology(body: TopologyRequest) -> dict:
    formatted = format_topology(body)
    result = await call_llm(
        system_prompt=VALIDATION_PROMPT,
        user_prompt=formatted,
    )
    return result


@app.post("/api/simulation/scan")
async def scan_topology(body: ScanRequest) -> dict:
    # Keep ALL nodes including defense nodes — scan must consider them as active controls
    formatted = format_topology(body)
    result = await call_llm(
        system_prompt=SCAN_PROMPT,
        user_prompt=formatted,
    )
    return result


@app.post("/api/simulation/run")
async def run_simulation(body: SimulationRequest) -> SimulationResponse:
    scenario = {
        "name": body.scenario_name,
        "target_node_id": body.target_node_id,
        "description": body.scenario_description,
    }

    formatted = format_simulation_request(body.topology, scenario)
    result = await call_llm(
        system_prompt=SIMULATION_PROMPT,
        user_prompt=formatted,
    )
    if result.get("attack_path"):
        result["attack_path"] = constrain_attack_path(result["attack_path"], body.topology.nodes)
    return SimulationResponse(**result)


@app.post("/api/simulation/run-with-defense")
async def run_simulation_with_defense(body: SimulationWithDefenseRequest) -> SimulationResponse:
    if not body.attack_path:
        raise HTTPException(status_code=400, detail="attack_path is required for re-run")

    scenario = {
        "name": body.scenario_name,
        "target_node_id": body.target_node_id,
        "description": body.scenario_description,
    }

    # Keep ALL nodes including defense nodes so LLM sees them as active controls
    formatted = format_simulation_request(body.topology, scenario)
    formatted += (
        "\n\n"
        "IMPORTANT — RE-RUN INSTRUCTIONS:\n"
        "You are re-running an attack that was ALREADY traced. "
        "Use the provided ORIGINAL attack path below and re-evaluate EACH step "
        "with the new defense measures in place.\n"
        "Do NOT generate a new attack path. Only update the 'status' of each step.\n\n"
        "Original Attack Path:\n"
    )
    for i, step in enumerate(body.attack_path):
        formatted += f"  Step {i + 1}: Node {step.node_id} — {step.action} (originally: {step.status})\n"

    system_prompt = SIMULATION_WITH_DEFENSE_PROMPT.replace("{defense_measures}", body.defense_measures)
    result = await call_llm(
        system_prompt=system_prompt,
        user_prompt=formatted,
    )
    if result.get("attack_path"):
        result["attack_path"] = constrain_attack_path(result["attack_path"], body.topology.nodes)
    return SimulationResponse(**result)

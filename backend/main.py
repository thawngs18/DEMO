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

# ---------------------------------------------------------------------------
# AI Helper & Topology Formatting
# ---------------------------------------------------------------------------


def format_topology(req: TopologyRequest) -> str:
    node_lines = [f"  - {n.id} (type: {n.data.type if n.data else n.type})" for n in req.nodes]
    edge_lines = [f"  - {e.source} -> {e.target}" for e in req.edges]
    return (
        f"Network Topology ({len(req.nodes)} nodes, {len(req.edges)} edges):\n"
        f"\n"
        f"Nodes:\n" + "\n".join(node_lines) + "\n"
        f"\n"
        f"Data Flow:\n" + "\n".join(edge_lines)
    )


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
async def scan_topology(body: TopologyRequest) -> dict:
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
    return result


@app.post("/api/simulation/run-with-defense")
async def run_simulation_with_defense(body: SimulationWithDefenseRequest) -> SimulationResponse:
    scenario = {
        "name": body.scenario_name,
        "target_node_id": body.target_node_id,
        "description": body.scenario_description,
    }

    formatted = format_simulation_request(body.topology, scenario)
    system_prompt = SIMULATION_WITH_DEFENSE_PROMPT.replace("{defense_measures}", body.defense_measures)
    result = await call_llm(
        system_prompt=system_prompt,
        user_prompt=formatted,
    )
    return result

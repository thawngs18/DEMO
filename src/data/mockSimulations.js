export const MOCK_SCENARIOS = [
  {
    id: 'scenario-1',
    name: 'SQL Injection Attack',
    description:
      'Attacker exploits unvalidated input on the public-facing web server to execute arbitrary SQL queries against the database.',
    attackPath: ['attacker-1', 'server-1', 'database-1'],
    defenseLogs: [
      '⚠ SQL injection vector detected on Server-1 (port 443, /api/query)',
      '→ Recommendation: Deploy a Firewall before the Server to filter malicious payloads.',
      '→ Recommendation: Add an IPS to inspect SQL-specific attack signatures.',
    ],
  },
  {
    id: 'scenario-2',
    name: 'Lateral Movement',
    description:
      'Attacker compromises a workstation via phishing and pivots through the internal network to reach the database.',
    attackPath: ['attacker-1', 'workstation-1', 'router-1', 'database-1'],
    defenseLogs: [
      '⚠ Lateral movement detected: Workstation-1 → Router-1 → Database-1',
      '→ Recommendation: Segment the network with a Firewall between workstation and database VLANs.',
      '→ Recommendation: Deploy IDS on the router to monitor east-west traffic.',
    ],
  },
  {
    id: 'scenario-3',
    name: 'DDoS via IoT Botnet',
    description:
      'Attacker compromises IoT devices and uses them to overwhelm the cloud infrastructure.',
    attackPath: ['attacker-1', 'iot-1', 'cloud-1'],
    defenseLogs: [
      '⚠ DDoS traffic detected from IoT-1 to Cloud-1 (bandwidth spike 12 Gbps)',
      '→ Recommendation: Place a Firewall at the cloud ingress to rate-limit traffic.',
      '→ Recommendation: Isolate IoT devices on a separate subnet via Router rules.',
    ],
  },
]

export const AI_GENERATED_NETWORKS = [
  {
    label: 'Basic Web Architecture',
    nodes: [
      { id: 'server-1', type: 'server', position: { x: 400, y: 100 } },
      { id: 'database-1', type: 'database', position: { x: 400, y: 350 } },
      { id: 'firewall-1', type: 'firewall', position: { x: 400, y: 550 } },
    ],
    edges: [
      { id: 'e-server-db', source: 'server-1', target: 'database-1' },
      { id: 'e-db-fw', source: 'database-1', target: 'firewall-1' },
    ],
  },
  {
    label: 'Corporate Network',
    nodes: [
      { id: 'router-1', type: 'router', position: { x: 400, y: 50 } },
      { id: 'firewall-1', type: 'firewall', position: { x: 400, y: 180 } },
      { id: 'server-1', type: 'server', position: { x: 250, y: 340 } },
      { id: 'database-1', type: 'database', position: { x: 550, y: 340 } },
      { id: 'cloud-1', type: 'cloud', position: { x: 400, y: 480 } },
    ],
    edges: [
      { id: 'e-r-fw', source: 'router-1', target: 'firewall-1' },
      { id: 'e-fw-s', source: 'firewall-1', target: 'server-1' },
      { id: 'e-fw-db', source: 'firewall-1', target: 'database-1' },
      { id: 'e-s-cl', source: 'server-1', target: 'cloud-1' },
    ],
  },
]

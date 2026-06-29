import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow'
import { getBestHandle } from '../utils/smartHandles'

var API_BASE = 'http://localhost:8000'

function resolveAnimationSteps(attackPath, edges) {
  var edgeMap = {}
  for (var i = 0; i < edges.length; i++) {
    var e = edges[i]
    edgeMap[e.source + '->' + e.target] = e.id
  }
  var steps = []
  for (var i = 0; i < attackPath.length; i++) {
    var step = attackPath[i]
    var edgeId = null
    if (i > 0) {
      var prevId = attackPath[i - 1].node_id
      edgeId = edgeMap[prevId + '->' + step.node_id] || null
    }
    steps.push({
      nodeId: step.node_id,
      edgeId: step.edge_id || edgeId,
      status: step.status,
      action: step.action || step.status,
      explanation: step.explanation || '',
      nextHint: step.next_hint || '',
      blockingDetail: step.blocking_detail || '',  // for blocked steps
    })
  }
  return steps
}

function formatResultBody(steps, isMitigated, defense, impactSummary, isRerun) {
  var indent = '   '
  var wrap = function(text, width) {
    if (!text) return ''
    if (text.length <= width) return indent + indent + text
    var words = text.split(' ')
    var lines = []
    var current = ''
    for (var i = 0; i < words.length; i++) {
      var next = current ? current + ' ' + words[i] : words[i]
      if (next.length > width) {
        lines.push(indent + indent + current)
        current = words[i]
      } else {
        current = next
      }
    }
    if (current) lines.push(indent + indent + current)
    return lines.join('\n')
  }

  var lines = []
  if (impactSummary && !isMitigated) {
    lines.push('Hacker Impact:')
    lines.push(wrap(impactSummary, 50))
    lines.push('')
  }
  steps.forEach(function(step, idx) {
    lines.push((idx + 1) + '. ' + (step.action || step.status))
    if (step.status === 'blocked') {
      lines.push(indent + '[BLOCKED]')
      if (step.blockingDetail) {
        lines.push(wrap('[Defense] ' + step.blockingDetail, 50))
      }
    }
  })
  // Only show Defense Hint on first run (not re-run with defense already applied)
  if (!isRerun) {
    if (defense) {
      lines.push('')
      lines.push('Defense Hint:')
      lines.push(indent + wrap(defense, 50))
    } else {
      lines.push('')
      lines.push('Defense Hint:')
      lines.push(indent + 'No specific defense recommendations available.')
    }
  }
  return lines.join('\n')
}

const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  mode: 'view',
  terminalLogs: [],
  isScanning: false,
  isSimulating: false,
  attackPaths: [],
  selectedNode: null,
  validation: 'idle',
  theme: 'dark',
  modalIsOpen: false,
  aiResultContent: null,
  modalLoading: false,
  animationSteps: [],
  animationIndex: -1,
  animationStatus: 'idle',
  animationDefense: '',
  scenarios: [],
  showScenariosPanel: false,

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set(function(state) {
      var sourceNode = state.nodes.find(function(n) { return n.id === connection.source })
      var targetNode = state.nodes.find(function(n) { return n.id === connection.target })
      if (sourceNode && targetNode) {
        connection.sourceHandle = getBestHandle(sourceNode, targetNode, 'source')
        connection.targetHandle = getBestHandle(targetNode, sourceNode, 'target')
      }
      return { edges: addEdge(connection, state.edges) }
    }),

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  setMode: (mode) => set({ mode }),

  addLog: (log) =>
    set((state) => ({
      terminalLogs: [
        ...state.terminalLogs,
        { id: crypto.randomUUID(), timestamp: Date.now(), ...log },
      ],
    })),

  clearLogs: () => set({ terminalLogs: [] }),

  setScanning: (isScanning) => set({ isScanning }),
  setSimulating: (isSimulating) => set({ isSimulating }),
  setAttackPaths: (attackPaths) => set({ attackPaths }),
  setScenarios: (scenarios) => set({ scenarios }),
  setShowScenariosPanel: (showScenariosPanel) => set({ showScenariosPanel }),

  setSelectedNode: (node) => set({ selectedNode: node }),
  setValidation: (validation) => set({ validation }),
  setTheme: (theme) => set({ theme }),
  setModalOpen: (modalIsOpen) => set({ modalIsOpen }),
  setAiResultContent: (aiResultContent) => set({ aiResultContent }),
  setModalLoading: (modalLoading) => set({ modalLoading }),

  updateEdgeHandles: (edgeId, sourceHandle, targetHandle) =>
    set(function(state) {
      return {
        edges: state.edges.map(function(e) {
          if (e.id !== edgeId) return e
          var updated = { ...e }
          if (sourceHandle !== undefined) updated.sourceHandle = sourceHandle
          if (targetHandle !== undefined) updated.targetHandle = targetHandle
          return updated
        }),
      }
    }),

  runSimulation: async (topology, scenarioId) => {
    var state = get()
    var scenario = state.scenarios.find(function(s) { return s.id === scenarioId }) || null
    set({
      animationSteps: [],
      animationIndex: 0,
      animationStatus: 'running',
      animationDefense: '',
      isSimulating: true,
    })

    var res
    try {
      res = await fetch(API_BASE + '/api/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topology: topology,
          scenario_id: scenarioId,
          scenario_name: scenario ? scenario.name : '',
          scenario_description: scenario ? scenario.description : '',
          target_node_id: scenario ? scenario.target_node_id : '',
        }),
      })
    } catch (_) {
      set({ animationStatus: 'idle', isSimulating: false })
      return
    }
    if (!res.ok) {
      set({ animationStatus: 'idle', isSimulating: false })
      return
    }

    var data = await res.json()
    var steps = resolveAnimationSteps(data.attack_path, state.edges)
    set({ animationSteps: steps, animationDefense: data.recommended_defense || '' })

    var defaultStyle = { stroke: '#00f0ff', strokeWidth: 2 }

    for (var i = 0; i < steps.length; i++) {
      set({ animationIndex: i })
      var step = steps[i]

      if (step.edgeId) {
        set(function(s) {
          return {
            edges: s.edges.map(function(e) {
              if (e.id !== step.edgeId) return e
              return { ...e, animated: true, style: { stroke: '#f43f5e', strokeWidth: 3 } }
            }),
          }
        })
      }

      if (step.status === 'blocked') break
      await new Promise(function(r) { setTimeout(r, 2000) })
    }

    var lastStep = steps[steps.length - 1]
    var isMitigated = lastStep && lastStep.status === 'blocked'
    var scenario = state.scenarios.find(function(s) { return s.id === scenarioId }) || null
    var targetNodeId = scenario ? scenario.target_node_id : 'Unknown'

    var body = formatResultBody(steps, isMitigated, data.recommended_defense || '', data.impact_summary || '', false)

    set(function(s) {
      return {
        animationStatus: isMitigated ? 'mitigated' : 'success',
        isSimulating: false,
        selectedNode: { id: targetNodeId },
        aiResultContent: {
          type: isMitigated ? 'warning' : 'success',
          title: isMitigated ? 'Attack Mitigated' : 'Attack Successful',
          body: body,
          defense: data.recommended_defense || '',  // store defense for re-run
        },
        modalIsOpen: true,
      }
    })

    await new Promise(function(r) { setTimeout(r, 3000) })

    set({
      animationSteps: [],
      animationIndex: -1,
      animationStatus: 'idle',
      animationDefense: '',
      selectedNode: null,
    })
    set(function(s) {
      return {
        edges: s.edges.map(function(e) {
          return { ...e, animated: false, style: defaultStyle }
        }),
      }
    })
  },

  // Re-run simulation with defense measures applied
  reRunWithDefense: async (defenseMeasures) => {
    var state = get()
    var scenarioId = state.attackPaths.length > 0 ? state.attackPaths[0].id : null
    
    // Get current topology
    var topology = {
      nodes: state.nodes.map(function(n) { return { id: n.id, type: n.type, label: n.data?.label || n.id } }),
      edges: state.edges.map(function(e) { return { id: e.id, source: e.source, target: e.target } }),
    }

    set({
      modalIsOpen: false,  // close current modal
      animationSteps: [],
      animationIndex: 0,
      animationStatus: 'running',
      isSimulating: true,
    })

    // Small delay to let modal close
    await new Promise(function(r) { setTimeout(r, 300) })

    var res
    try {
      res = await fetch(API_BASE + '/api/simulation/run-with-defense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topology: topology,
          scenario_id: scenarioId || 'defense-run',
          scenario_name: 'Defense Simulation',
          scenario_description: 'Re-running attack with defenses in place',
          target_node_id: scenarioId ? (state.scenarios.find(function(s) { return s.id === scenarioId }) || {}).target_node_id : '',
          defense_measures: defenseMeasures,
        }),
      })
    } catch (e) {
      console.error('[Store] Re-run with defense failed:', e)
      set({ animationStatus: 'idle', isSimulating: false })
      return
    }
    if (!res.ok) {
      set({ animationStatus: 'idle', isSimulating: false })
      return
    }

    var data = await res.json()
    var steps = resolveAnimationSteps(data.attack_path, state.edges)
    set({ animationSteps: steps })

    var defaultStyle = { stroke: '#00f0ff', strokeWidth: 2 }

    for (var i = 0; i < steps.length; i++) {
      set({ animationIndex: i })
      var step = steps[i]

      if (step.edgeId) {
        set(function(s) {
          return {
            edges: s.edges.map(function(e) {
              if (e.id !== step.edgeId) return e
              var color = step.status === 'blocked' ? '#22c55e' : (step.status === 'bypassed' ? '#f59e0b' : '#f43f5e')
              return { ...e, animated: true, style: { stroke: color, strokeWidth: 3 } }
            }),
          }
        })
      }

      if (step.status === 'blocked') {
        // Show blocking detail immediately
        await new Promise(function(r) { setTimeout(r, 1500) })
        break
      }
      await new Promise(function(r) { setTimeout(r, 2000) })
    }

    var lastStep = steps[steps.length - 1]
    var isMitigated = lastStep && (lastStep.status === 'blocked' || lastStep.status === 'bypassed')

    // Don't show defense hint for re-run results - defense is already applied
    var body = formatResultBody(steps, isMitigated, '', data.impact_summary || '', true)

    set(function(s) {
      return {
        animationStatus: 'mitigated',
        isSimulating: false,
        aiResultContent: {
          type: 'warning',
          title: 'Attack Mitigated',
          subtitle: 'Defenses in place',
          body: body,
        },
        modalIsOpen: true,
      }
    })

    await new Promise(function(r) { setTimeout(r, 3000) })

    set({
      animationSteps: [],
      animationIndex: -1,
      animationStatus: 'idle',
      selectedNode: null,
    })
    set(function(s) {
      return {
        edges: s.edges.map(function(e) {
          return { ...e, animated: false, style: defaultStyle }
        }),
      }
    })
  },
}))

export default useStore
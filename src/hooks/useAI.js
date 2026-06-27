import useStore from '../store/useStore'
import { useSimulation } from './useSimulation'

export function useAI() {
  var store = useStore()
  var addLog = store.addLog
  var setNodes = store.setNodes
  var setEdges = store.setEdges
  var clearLogs = store.clearLogs
  var setAiResultContent = store.setAiResultContent
  var setModalOpen = store.setModalOpen
  var setModalLoading = store.setModalLoading
  var setScanning = store.setScanning

  var sim = useSimulation()
  var scanAttack = sim.scanAttack
  var simulateAttack = sim.simulateAttack

  var API_BASE = 'http://localhost:8000'

  function formatNetworkDetail(network) {
    var nodeLines = network.nodes.map(function(n) {
      return '  \u2022 ' + n.id + ' \u2014 ' + n.type.charAt(0).toUpperCase() + n.type.slice(1)
    }).join('\n')

    var edgeLines = network.edges.map(function(e) {
      return '  \u2022 ' + e.source + '  \u2192  ' + e.target
    }).join('\n')

    return (
      'Network Topology Generated\n' +
      '  Name: ' + network.label + '\n' +
      '\n' +
      'Nodes Deployed (' + network.nodes.length + '):\n' + nodeLines + '\n' +
      '\n' +
      'Connections (' + network.edges.length + '):\n' + edgeLines + '\n' +
      '\n' +
      '\u2726 Security Note: Ensure all traffic paths are monitored. Consider adding IDS/IPS for threat detection.'
    )
  }

  function formatHelp() {
    return (
      'Available Commands\n' +
      '\n' +
      '  generate     \u2014 AI generates a network topology from scratch\n' +
      '  scan         \u2014 Scan the current topology for vulnerabilities\n' +
      '  simulate     \u2014 Run an attack simulation on the current network\n' +
      '  clear        \u2014 Clear the terminal history\n' +
      '  help         \u2014 Show this help message\n' +
      '\n' +
      'Tip: Start with "generate" to create a network, then "scan" to find weak points.'
    )
  }

  function formatError(input) {
    return (
      'Unknown Command\n' +
      '  "' + input + '" is not recognized.\n' +
      '\n' +
      'Try one of the following:\n' +
      '  \u2022 generate   \u2014 Create a network topology\n' +
      '  \u2022 scan       \u2014 Scan for vulnerabilities\n' +
      '  \u2022 simulate   \u2014 Run an attack simulation\n' +
      '  \u2022 help       \u2014 Show all available commands\n' +
      '  \u2022 clear      \u2014 Clear the terminal'
    )
  }

  function formatSimulationResult(status, defense) {
    if (status === 'success') {
      return (
        'Attack Simulation Complete\n' +
        '  Status: SUCCESS \u2014 Target compromised\n' +
        '\n' +
        'Recommended Defense:\n' +
        '  ' + defense.replace(/\n/g, '\n  ')
      )
    }
    return (
      'Attack Simulation Complete\n' +
      '  Status: MITIGATED \u2014 Attack was blocked\n' +
      '\n' +
      'Recommended Defense:\n' +
      '  ' + defense.replace(/\n/g, '\n  ')
    )
  }

  async function sendMessage(input, showModal) {
    addLog({ text: '$ ' + input, type: 'input' })

    var lower = input.toLowerCase()

    if (lower.includes('generate') || lower.includes('create') || lower.includes('build')) {
      addLog({ text: 'Generating network topology with AI...', type: 'info' })
      clearLogs()

      try {
        var prompt = input.replace(/generate|create|build/gi, '').trim() || 'Create a secure network topology'
        var genRes = await fetch(API_BASE + '/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt }),
        })
        if (!genRes.ok) throw new Error('Generation failed')
        var genData = await genRes.json()

        var network = {
          label: genData.label,
          nodes: genData.nodes.map(function(n) {
            return {
              id: n.id,
              type: n.type || 'custom',
              position: n.position,
              data: {
                type: n.data && n.data.type ? n.data.type : 'unknown',
                label: n.data && n.data.label ? n.data.label : (n.id || 'Node'),
              },
            }
          }),
          edges: genData.edges.map(function(e) {
            return {
              id: e.id,
              source: e.source,
              target: e.target,
            }
          }),
        }

        addLog({ text: 'Generated: "' + network.label + '"', type: 'success' })
        addLog({ text: '  ' + network.nodes.length + ' nodes deployed', type: 'info' })
        addLog({ text: '  ' + network.edges.length + ' connections established', type: 'info' })
        setNodes(network.nodes)
        setEdges(network.edges)

        if (showModal) {
          setAiResultContent({ type: 'success', title: 'Topology Generated', body: formatNetworkDetail(network) })
          setModalLoading(false)
          setModalOpen(true)
        }
      } catch (err) {
        addLog({ text: 'Generation failed: ' + err.message, type: 'warn' })
        if (showModal) {
          setAiResultContent({ type: 'error', title: 'Generation Failed', body: 'Unable to generate topology. Please check if the backend is running and GOOGLE_API_KEY is set.' })
          setModalLoading(false)
          setModalOpen(true)
        }
      }
      return
    }

    if (lower.includes('help')) {
      addLog({ text: 'Available commands:', type: 'info' })
      addLog({ text: '  generate <name>  - AI generates a network topology', type: 'info' })
      addLog({ text: '  scan            - Scan for vulnerabilities', type: 'info' })
      addLog({ text: '  simulate        - Run an attack simulation', type: 'info' })
      addLog({ text: '  clear           - clear terminal', type: 'info' })
      addLog({ text: '  help            - show this message', type: 'info' })

      if (showModal) {
        setAiResultContent({ type: 'info', title: 'Help & Commands', body: formatHelp() })
        setModalLoading(false)
        setModalOpen(true)
      }
      return
    }

    if (lower.includes('scan')) {
      addLog({ text: 'Scanning attack surface...', type: 'info' })
      setScanning(true)

      try {
        var scanTopology = { nodes: store.nodes, edges: store.edges }
        var scanRes = await fetch(API_BASE + '/api/simulation/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scanTopology),
        })
        if (!scanRes.ok) throw new Error('Scan failed')
        var scanData = await scanRes.json()

        if (!scanData.scenarios || scanData.scenarios.length === 0) {
          addLog({ text: 'No vulnerabilities found', type: 'success' })
          store.setScenarios([])
          setScanning(false)
          if (showModal) {
            setAiResultContent({ type: 'success', title: 'Scan Complete', body: 'No attack scenarios detected. Your network appears secure.' })
            setModalLoading(false)
            setModalOpen(true)
          }
          return
        }

        addLog({ text: scanData.scenarios.length + ' attack scenario(s) found:', type: 'attack' })
        scanData.scenarios.forEach(function(s, i) {
          addLog({ text: '  ' + (i + 1) + '. ' + s.name, type: 'success' })
        })

        store.setScenarios(scanData.scenarios)

        if (showModal) {
          setAiResultContent({
            type: 'info',
            title: 'Scan Complete',
            body: scanData.scenarios.map(function(s, i) {
              return (i + 1) + '. ' + s.name + '\n   ' + s.description
            }).join('\n\n'),
          })
          setModalLoading(false)
          setModalOpen(true)
        }
      } catch (err) {
        addLog({ text: 'Scan failed: ' + err.message, type: 'warn' })
      }
      setScanning(false)
      return
    }

    if (lower.includes('simulate')) {
      addLog({ text: 'Running attack simulation...', type: 'attack' })

      try {
        var scenario = simulateAttack()
        if (!scenario) {
          addLog({ text: 'No scenarios found. Run "scan" first.', type: 'warn' })
          return
        }
      } catch (err) {
        addLog({ text: 'Simulation failed: ' + err.message, type: 'warn' })
      }
      return
    }

    if (lower.includes('clear')) {
      clearLogs()
      return
    }

    addLog({ text: 'AI: I don\'t understand "' + input + '". Try "generate", "clear", or "help".', type: 'info' })

    if (showModal) {
      setAiResultContent({ type: 'warning', title: 'Unrecognized Command', body: formatError(input) })
      setModalLoading(false)
      setModalOpen(true)
    }
  }

  function setLLMProvider(_provider) {
    addLog({ text: 'AI: LLM provider stub - implement in useAI.js', type: 'info' })
  }

  function abortRequest() {
    addLog({ text: 'Request aborted - not implemented', type: 'warn' })
  }

  return { sendMessage, setLLMProvider, abortRequest }
}

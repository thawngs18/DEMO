import useStore from '../store/useStore'

export function useSimulation() {
  var store = useStore()

  function scanAttack() {
    store.setScanning(true)
    store.addLog({ text: 'Scanning attack surface...', type: 'info' })

    fetch('http://localhost:8000/api/simulation/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: store.nodes, edges: store.edges }),
    })
      .then(function(res) {
        if (!res.ok) throw new Error('Scan failed')
        return res.json()
      })
      .then(function(data) {
        if (!data.scenarios || data.scenarios.length === 0) {
          store.addLog({ text: 'No vulnerabilities found - network is secure', type: 'success' })
          store.setScanning(false)
          store.setAttackPaths([])
          return
        }

        store.addLog({ text: data.scenarios.length + ' attack scenario(s) found:', type: 'attack' })
        data.scenarios.forEach(function(s, i) {
          store.addLog({ text: '  ' + (i + 1) + '. ' + s.name, type: 'success' })
        })

        store.setScenarios(data.scenarios)
        store.setShowScenariosPanel(true)
        store.setScanning(false)
      })
      .catch(function(err) {
        store.addLog({ text: 'Scan failed: ' + err.message, type: 'warn' })
        store.setScanning(false)
      })
  }

  function simulateAttack(scenarioId) {
    var targetScenarioId = scenarioId
    if (!targetScenarioId) {
      var scenarios = store.scenarios || []
      targetScenarioId = scenarios[0] ? scenarios[0].id : null
    }

    var targetScenario = store.scenarios.find(function(s) { return s.id === targetScenarioId }) || null
    if (!targetScenario) {
      store.addLog({ text: 'No scenarios found. Run scan first.', type: 'warn' })
      return
    }

    store.runSimulation(
      { nodes: store.nodes, edges: store.edges },
      targetScenarioId
    )
  }

  function stopSimulation() {
    store.setSimulating(false)
    store.setAttackPaths([])
    store.addLog({ text: 'Simulation halted.', type: 'info' })
  }

  return { scanAttack, simulateAttack, stopSimulation }
}

import { X, AlertTriangle, Play } from 'lucide-react'
import GlassPanel from '../ui/GlassPanel'
import GlowButton from '../ui/GlowButton'
import useStore from '../../store/useStore'
import { useSimulation } from '../../hooks/useSimulation'

export default function ScenariosPanel() {
  const scenarios = useStore(function(s) { return s.scenarios })
  const isScanning = useStore(function(s) { return s.isScanning })
  const isSimulating = useStore(function(s) { return s.isSimulating })
  const setMode = useStore(function(s) { return s.setMode })
  const setShowScenariosPanel = useStore(function(s) { return s.setShowScenariosPanel })
  const { scanAttack, simulateAttack } = useSimulation()

  function handleScan() {
    scanAttack()
  }

  function handleSimulate(scenarioId) {
    simulateAttack(scenarioId)
  }

  function handleClose() {
    setMode('view')
    setShowScenariosPanel(false)
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 z-10 p-3 pointer-events-none">
      <GlassPanel className="h-full p-4 pointer-events-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Attack Scenarios</h3>
          <button onClick={handleClose} className="text-white/30 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {isScanning && (
          <div className="text-xs text-white/50 mb-3">Scanning attack surface...</div>
        )}

        {isSimulating && (
          <div className="text-xs text-cyber-cyan mb-3">Running simulation...</div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3">
          {scenarios.length === 0 && !isScanning && (
            <div className="text-xs text-white/30 text-center mt-8">
              No attack scenarios detected.
              <br />
              Run a scan to find vulnerabilities.
            </div>
          )}

          {scenarios.map(function(scenario) {
            return (
              <div
                key={scenario.id}
                className="rounded-lg border border-white/5 bg-slate-900/40 p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/90 break-words">
                      {scenario.name}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5 break-words">
                      Target: {scenario.target_node_id}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-white/50 leading-relaxed break-words">
                  {scenario.description}
                </p>

                <button
                  onClick={function() { handleSimulate(scenario.id) }}
                  disabled={isSimulating || isScanning}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md bg-red-500/10 border border-red-500/30 px-2.5 py-1.5 text-[10px] font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Play size={10} />
                  {isSimulating ? 'Running...' : 'Simulate'}
                </button>
              </div>
            )
          })}
        </div>

      </GlassPanel>
    </div>
  )
}

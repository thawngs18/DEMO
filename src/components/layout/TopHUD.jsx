import { Search, Square, Sun, Moon } from 'lucide-react'
import GlowButton from '../ui/GlowButton'
import useStore from '../../store/useStore'
import { useSimulation } from '../../hooks/useSimulation'

export default function TopHUD() {
  var store = useStore()
  var mode = store.mode
  var nodes = store.nodes
  var isSimulating = store.isSimulating
  var isScanning = store.isScanning
  var setMode = store.setMode
  var addLog = store.addLog
  var theme = store.theme
  var setTheme = store.setTheme

  var sim = useSimulation()
  var scanAttack = sim.scanAttack
  var stopSimulation = sim.stopSimulation

  return (
    <header className="h-full flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-3">
        <span className="text-cyber-cyan font-bold text-lg tracking-widest">CLOUD NEXUS</span>
        <span className="text-xs text-white/20 font-mono uppercase tracking-wider hidden sm:inline">
          Threat Modeling Platform
        </span>
      </div>

      <div className="flex items-center gap-2">
        <GlowButton color="cyan" onClick={scanAttack} disabled={nodes.length === 0 || isScanning}>
          <Search size={14} className="mr-1.5 inline" />
          Scan Attack
        </GlowButton>

        {isSimulating ? (
          <GlowButton color="red" onClick={stopSimulation}>
            <Square size={14} className="mr-1.5 inline" />
            Stop
          </GlowButton>
        ) : null}

        <div className="w-px h-6 bg-white/10 mx-2" />

        <button
          onClick={function() { setTheme(theme === 'dark' ? 'light' : 'dark') }}
          className="text-white/40 hover:text-cyber-cyan transition-colors focus:outline-none"
          title={'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
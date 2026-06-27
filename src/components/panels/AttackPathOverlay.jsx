import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'

export default function AttackPathOverlay() {
  var attackPaths = useStore(function(s) { return s.attackPaths })
  var isSimulating = useStore(function(s) { return s.isSimulating })
  var nodes = useStore(function(s) { return s.nodes })

  return (
    <AnimatePresence>
      {isSimulating && attackPaths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-4 left-4 z-10"
        >
          <div className="px-4 py-3 rounded-lg bg-slate-900/80 backdrop-blur-md border border-cyber-red/30 shadow-glow-red-sm text-xs font-mono space-y-1">
            <p className="text-cyber-red font-bold tracking-wider uppercase text-[10px]">
              Active Attack Paths
            </p>
            {attackPaths.map(function(path, i) {
              var nodeLabels = path.nodeIds.map(function(id) {
                var n = nodes.find(function(nd) { return nd.id === id })
                return n && n.data ? n.data.label : id
              })
              var status = path.blocked
                ? 'BLOCKED at ' + nodeLabels[path.blockedAtIndex]
                : 'COMPROMISED'

              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={'w-1.5 h-1.5 rounded-full ' + (path.blocked ? 'bg-cyber-green' : 'bg-cyber-red')} />
                  <span className="text-white/70">{nodeLabels.join(' -> ')}</span>
                  <span className={'text-[9px] ' + (path.blocked ? 'text-cyber-green' : 'text-cyber-red')}>
                    [{status}]
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import GlassPanel from '../ui/GlassPanel'
import GlowButton from '../ui/GlowButton'
import useStore from '../../store/useStore'
import { NODE_DEFINITIONS } from '../../data/nodeDefinitions'

export default function EditPanel() {
  var selectedNode = useStore(function(s) { return s.selectedNode })
  var setSelectedNode = useStore(function(s) { return s.setSelectedNode })
  var setMode = useStore(function(s) { return s.setMode })
  var nodes = useStore(function(s) { return s.nodes })
  var setNodes = useStore(function(s) { return s.setNodes })

  var nodeData = selectedNode ? nodes.find(function(n) { return n.id === selectedNode.id }) : null
  var def = nodeData ? NODE_DEFINITIONS.find(function(d) { return d.type === (nodeData.data ? nodeData.data.type : null) }) : null
  var Icon = def ? def.icon : null

  function handleClose() {
    setSelectedNode(null)
    setMode('view')
  }

  function handleDelete() {
    if (!nodeData) return
    setNodes(nodes.filter(function(n) { return n.id !== nodeData.id }))
    setSelectedNode(null)
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 320 }}
        animate={{ x: 0 }}
        exit={{ x: 320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 bottom-0 w-72 z-20 p-3 pointer-events-none"
      >
        <GlassPanel className="h-full p-4 pointer-events-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Node Inspector</h3>
            <button onClick={handleClose} className="text-white/30 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {nodeData ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-white/5">
                {Icon && <Icon size={20} className="text-cyber-cyan" />}
                <div>
                  <p className="text-sm font-medium">{(def ? def.label : null) || (nodeData.data ? nodeData.data.type : null)}</p>
                  <p className="text-[10px] font-mono text-white/30">{nodeData.id}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>Type</span>
                  <span className="text-white font-mono">{nodeData.data ? nodeData.data.type : ''}</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Position</span>
                  <span className="text-white font-mono">
                    {Math.round(nodeData.position ? nodeData.position.x : 0)}, {Math.round(nodeData.position ? nodeData.position.y : 0)}
                  </span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Category</span>
                  <span className="text-white font-mono">{def ? def.category : '-'}</span>
                </div>
              </div>

              <div className="mt-auto space-y-2">
                <GlowButton color="red" className="w-full" onClick={handleDelete}>
                  Delete Node
                </GlowButton>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/20 text-xs text-center">
              Select a node on the canvas to inspect its properties
            </div>
          )}
        </GlassPanel>
      </motion.aside>
    </AnimatePresence>
  )
}
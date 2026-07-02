import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield } from 'lucide-react'
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
  var hasDefenseApplied = useStore(function(s) { return s.hasDefenseApplied })
  var blockedNodeIds = useStore(function(s) { return s.blockedNodeIds })
  var animationSteps = useStore(function(s) { return s.animationSteps })

  var nodeData = selectedNode ? nodes.find(function(n) { return n.id === selectedNode.id }) : null
  var def = nodeData ? NODE_DEFINITIONS.find(function(d) { return d.type === (nodeData.data ? nodeData.data.type : null) }) : null
  var Icon = def ? def.icon : null

  var isDefenseNode = hasDefenseApplied && blockedNodeIds.includes(selectedNode ? selectedNode.id : '')

  var blockingInfo = null
  if (isDefenseNode) {
    for (var b = 0; b < animationSteps.length; b++) {
      if (animationSteps[b].nodeId === selectedNode.id && animationSteps[b].status === 'blocked') {
        blockingInfo = {
          blockingDetail: animationSteps[b].blockingDetail || 'Security control detected',
          action: animationSteps[b].action || 'Attack attempt',
          explanation: animationSteps[b].explanation || '',
        }
        break
      }
    }
    if (!blockingInfo) {
      blockingInfo = {
        blockingDetail: 'Defense activated - attack blocked',
        action: 'Attack attempt',
        explanation: 'Security control prevented breach',
      }
    }
  }

  var configuredDefenses = []
  if (nodeData && nodeData.data && nodeData.data.configuredDefenses) {
    configuredDefenses = nodeData.data.configuredDefenses
  }
  var hasConfiguredDefenses = configuredDefenses.length > 0

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
              <div className={'flex items-center gap-3 px-3 py-2 rounded-lg border ' + (isDefenseNode ? 'bg-cyber-green/10 border-cyber-green/30' : 'bg-slate-800/60 border-white/5')}>
                {Icon && <Icon size={20} className={isDefenseNode ? 'text-cyber-green' : 'text-cyber-cyan'} />}
                <div>
                  <p className="text-sm font-medium">{(def ? def.label : null) || (nodeData.data ? nodeData.data.type : null)}</p>
                  <p className="text-[10px] font-mono text-white/30">{nodeData.id}</p>
                </div>
                {isDefenseNode && (
                  <Shield size={16} className="ml-auto text-cyber-green" />
                )}
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
                {isDefenseNode && (
                  <div className="flex justify-between text-white/50">
                    <span>Status</span>
                    <span className="text-cyber-green font-mono font-semibold">BLOCKED</span>
                  </div>
                )}
              </div>

              {isDefenseNode && blockingInfo && !hasConfiguredDefenses && (
                <div className="mt-2 p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-cyber-green" />
                    <span className="text-xs font-bold text-cyber-green">DEFENSE ACTIVE</span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                      <p className="text-[9px] text-red-400 font-semibold mb-1">ATTACK ATTEMPT</p>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        {blockingInfo.action}
                      </p>
                      {blockingInfo.explanation && (
                        <p className="text-[9px] text-white/50 mt-1 italic">
                          {blockingInfo.explanation}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-center">
                      <span className="text-cyber-green text-sm">▼ BLOCKED ▼</span>
                    </div>

                    <div className="bg-cyber-green/10 border border-cyber-green/30 rounded p-2">
                      <p className="text-[9px] text-cyber-green font-semibold mb-1">HOW IT WAS BLOCKED</p>
                      <p className="text-[10px] text-white/80 leading-relaxed">
                        {blockingInfo.blockingDetail}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <p className="text-[9px] text-cyber-green/70">
                      Result: Request terminated before reaching target
                    </p>
                  </div>

                  <div className="pt-3 mt-1">
                    <GlowButton color="green" className="w-full" onClick={function() {
                      if (!blockingInfo) return
                      useStore.getState().applyDefenseToDiagram({
                        nodeId: selectedNode.id,
                        defense: blockingInfo,
                      })
                    }}>
                      Apply this defense
                    </GlowButton>
                    <p className="text-[9px] text-white/40 text-center mt-2">
                      Adds a defense node/rule based on this blocked attempt
                    </p>
                  </div>
                </div>
              )}

              {hasConfiguredDefenses && (
                <div className="mt-2 p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-cyber-green" />
                    <span className="text-xs font-bold text-cyber-green">CONFIGURED DEFENSES</span>
                  </div>

                  <div className="space-y-1">
                    {configuredDefenses.map(function(rule) {
                      return (
                        <div key={rule.id} className="flex items-start justify-between bg-slate-900/50 rounded p-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white/80 font-medium leading-tight">{rule.shortLabel}</p>
                            {rule.command && (
                              <p className="text-[9px] text-white/40 font-mono mt-0.5 truncate">{rule.command}</p>
                            )}
                          </div>
                          <button
                            onClick={function() {
                              useStore.getState().setNodes(
                                useStore.getState().nodes.map(function(n) {
                                  if (n.id !== selectedNode.id) return n
                                  return {
                                    ...n,
                                    data: {
                                      ...n.data,
                                      configuredDefenses: n.data.configuredDefenses.filter(function(r) { return r.id !== rule.id }),
                                    },
                                  }
                                })
                              )
                            }}
                            className="ml-2 text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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

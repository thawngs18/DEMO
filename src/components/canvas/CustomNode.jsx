import { memo, useState } from 'react'
import { Handle, Position } from 'reactflow'
import { Shield } from 'lucide-react'
import { NODE_DEFINITIONS } from '../../data/nodeDefinitions'
import useStore from '../../store/useStore'

var handleStyle = '!w-2.5 !h-2.5 !border !border-cyber-cyan/40 !bg-cyber-cyan/15 hover:!bg-cyber-cyan/40 hover:!border-cyber-cyan/70 !transition-all !duration-150'

function CustomNode({ id, data, selected }) {
  var [showDefenseTooltip, setShowDefenseTooltip] = useState(false)
  var theme = useStore(function(s) { return s.theme })
  var isDark = theme === 'dark'
  var selectedNode = useStore(function(s) { return s.selectedNode })
  var attackPaths = useStore(function(s) { return s.attackPaths })
  var isSimulating = useStore(function(s) { return s.isSimulating })
  var animationSteps = useStore(function(s) { return s.animationSteps })
  var animationIndex = useStore(function(s) { return s.animationIndex })
  var hasDefenseApplied = useStore(function(s) { return s.hasDefenseApplied })
  var blockedNodeIds = useStore(function(s) { return s.blockedNodeIds })

  var isAttackTarget = selectedNode ? selectedNode.id === id : false

  var def = NODE_DEFINITIONS.find(function(d) { return d.type === data.type })
  var Icon = def ? def.icon : null

  // Check if this node blocked the attack
  var isDefenseNode = hasDefenseApplied && blockedNodeIds.includes(id)

  var animNodeStatus = null
  if (animationIndex >= 0) {
    for (var a = 0; a <= animationIndex && a < animationSteps.length; a++) {
      if (animationSteps[a].nodeId === id) {
        animNodeStatus = animationSteps[a].status
        break
      }
    }
  }

  var isInAttackPath = animNodeStatus
    ? (animNodeStatus === 'compromised' || animNodeStatus === 'bypassed')
    : (isSimulating && attackPaths.some(function(p) { return p.nodeIds.includes(id) }))
  var isBlocked = animNodeStatus
    ? animNodeStatus === 'blocked'
    : (isSimulating && attackPaths.some(function(p) { return p.blocked && p.nodeIds.includes(id) && p.nodeIds.indexOf(id) <= p.blockedAtIndex }))

  // Get blocking details for tooltip
  var blockingInfo = null
  if (isBlocked && animationIndex >= 0) {
    for (var b = 0; b <= animationIndex && b < animationSteps.length; b++) {
      if (animationSteps[b].nodeId === id && animationSteps[b].status === 'blocked') {
        blockingInfo = {
          blockingDetail: animationSteps[b].blockingDetail || 'Security control detected',
          action: animationSteps[b].action || 'Attack attempt',
          explanation: animationSteps[b].explanation || '',
        }
        break
      }
    }
  }

  var nodeBg = isDark ? 'bg-slate-900' : 'bg-white'
  var labelClass = isDark ? 'text-white' : 'text-slate-800'
  var idClass = isDark ? 'text-white/30' : 'text-slate-400'
  var iconColor = isDark
    ? isInAttackPath && !isBlocked
      ? 'text-cyber-red'
      : isBlocked
        ? 'text-cyber-green'
        : 'text-cyber-cyan'
    : isInAttackPath && !isBlocked
      ? 'text-red-500'
      : isBlocked
        ? 'text-green-600'
        : 'text-slate-500'

  var borderClass = isDark ? 'border-white/10' : 'border-slate-200'
  if (isAttackTarget) {
    borderClass = isDark ? 'border-amber-400/70 shadow-[0_0_18px_rgba(251,191,36,0.25)]' : 'border-amber-400 shadow-sm'
  } else if (isInAttackPath && !isBlocked) {
    borderClass = isDark ? 'border-cyber-red/60 shadow-glow-red-sm animate-pulse-glow-fast' : 'border-red-400 shadow-sm'
  } else if (isBlocked) {
    borderClass = isDark ? 'border-cyber-green/60 shadow-glow-green-sm animate-pulse-glow' : 'border-green-400 shadow-sm'
  } else if (selected) {
    borderClass = isDark ? 'border-cyber-cyan/60 shadow-glow-cyan-sm' : 'border-cyan-400 shadow-md'
  }

  return (
    <div className="relative">
      <div
        className={'px-4 py-3 rounded-xl min-w-[140px] border-2 transition-all duration-300 ' + nodeBg + ' ' + borderClass}
        onMouseEnter={function() { if (isBlocked) setShowDefenseTooltip(true) }}
        onMouseLeave={function() { setShowDefenseTooltip(false) }}
      >
        <Handle type="target" id="top-target" position={Position.Top} className={handleStyle} />
        <Handle type="source" id="top-source" position={Position.Top} className={handleStyle} />
        <Handle type="target" id="left-target" position={Position.Left} className={handleStyle} />
        <Handle type="source" id="left-source" position={Position.Left} className={handleStyle} />

        <div className="flex items-center gap-2.5">
          {Icon && (
            <Icon size={20} className={iconColor} />
          )}
          <div className="flex-1">
            <p className={'text-sm font-medium leading-tight ' + labelClass}>
              {data.label || (def ? def.label : data.type) || 'Node'}
            </p>
            <p className={'text-[10px] font-mono ' + idClass}>{id}</p>
          </div>
          {/* Defense badge */}
          {isDefenseNode && (
            <div className="flex items-center justify-center w-5 h-5 bg-cyber-green/20 border border-cyber-green/50 rounded-full">
              <Shield size={12} className="text-cyber-green" />
            </div>
          )}
        </div>

        <Handle type="source" id="right-source" position={Position.Right} className={handleStyle} />
        <Handle type="target" id="right-target" position={Position.Right} className={handleStyle} />
        <Handle type="source" id="bottom-source" position={Position.Bottom} className={handleStyle} />
        <Handle type="target" id="bottom-target" position={Position.Bottom} className={handleStyle} />
      </div>

      {/* Defense Tooltip - Shows attack vs defense breakdown on hover */}
      {showDefenseTooltip && blockingInfo && (
        <div className="absolute left-full top-0 ml-3 z-50 w-72">
          <div className="bg-slate-900/98 border border-cyber-green/40 rounded-lg shadow-2xl shadow-black/50 p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-cyber-green">DEFENSE ACTIVE</span>
              <span className="text-[10px] text-white/40">{data.label || def?.label || id}</span>
            </div>

            {/* Attack vs Defense Breakdown */}
            <div className="space-y-2">
              {/* Attack attempt */}
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

              {/* Arrow indicator */}
              <div className="flex justify-center">
                <span className="text-cyber-green text-sm">▼ BLOCKED ▼</span>
              </div>

              {/* Defense mechanism */}
              <div className="bg-cyber-green/10 border border-cyber-green/30 rounded p-2">
                <p className="text-[9px] text-cyber-green font-semibold mb-1">HOW IT WAS BLOCKED</p>
                <p className="text-[10px] text-white/80 leading-relaxed">
                  {blockingInfo.blockingDetail}
                </p>
              </div>
            </div>

            {/* Result */}
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-[9px] text-cyber-green/70">
                Result: Request terminated before reaching target
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(CustomNode)

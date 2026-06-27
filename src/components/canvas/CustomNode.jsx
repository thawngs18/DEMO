import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { NODE_DEFINITIONS } from '../../data/nodeDefinitions'
import useStore from '../../store/useStore'

var handleStyle = '!w-2.5 !h-2.5 !border !border-cyber-cyan/40 !bg-cyber-cyan/15 hover:!bg-cyber-cyan/40 hover:!border-cyber-cyan/70 !transition-all !duration-150'

function CustomNode({ id, data, selected }) {
  var theme = useStore(function(s) { return s.theme })
  var isDark = theme === 'dark'
  var selectedNode = useStore(function(s) { return s.selectedNode })
  const attackPaths = useStore(function(s) { return s.attackPaths })
  const isSimulating = useStore(function(s) { return s.isSimulating })
  const animationSteps = useStore(function(s) { return s.animationSteps })
  const animationIndex = useStore(function(s) { return s.animationIndex })

  var isAttackTarget = selectedNode ? selectedNode.id === id : false

  var def = NODE_DEFINITIONS.find(function(d) { return d.type === data.type })
  var Icon = def ? def.icon : null

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
    <div
      className={'px-4 py-3 rounded-xl min-w-[140px] border-2 transition-all duration-300 ' + nodeBg + ' ' + borderClass}
    >
      <Handle type="target" id="top-target" position={Position.Top} className={handleStyle} />
      <Handle type="source" id="top-source" position={Position.Top} className={handleStyle} />
      <Handle type="target" id="left-target" position={Position.Left} className={handleStyle} />
      <Handle type="source" id="left-source" position={Position.Left} className={handleStyle} />

      <div className="flex items-center gap-2.5">
        {Icon && (
          <Icon size={20} className={iconColor} />
        )}
        <div>
          <p className={'text-sm font-medium leading-tight ' + labelClass}>
            {data.label || (def ? def.label : data.type) || 'Node'}
          </p>
          <p className={'text-[10px] font-mono ' + idClass}>{id}</p>
        </div>
      </div>

      <Handle type="source" id="right-source" position={Position.Right} className={handleStyle} />
      <Handle type="target" id="right-target" position={Position.Right} className={handleStyle} />
      <Handle type="source" id="bottom-source" position={Position.Bottom} className={handleStyle} />
      <Handle type="target" id="bottom-target" position={Position.Bottom} className={handleStyle} />
    </div>
  )
}

export default memo(CustomNode)

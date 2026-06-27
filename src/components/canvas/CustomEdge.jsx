import { memo } from 'react'
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from 'reactflow'
import useStore from '../../store/useStore'
import { computeSmartPath } from '../../utils/edgeRouting'

function CustomEdge({
  id, source, target, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, selected,
}) {
  var nodes = useStore(function(s) { return s.nodes })
  var attackPaths = useStore(function(s) { return s.attackPaths })
  var isSimulating = useStore(function(s) { return s.isSimulating })
  var animationSteps = useStore(function(s) { return s.animationSteps })
  var animationIndex = useStore(function(s) { return s.animationIndex })

  var obstacles = []
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i]
    if (n.id === source || n.id === target) continue
    if (n.width == null || n.height == null) continue
    obstacles.push({
      x: n.position.x,
      y: n.position.y,
      w: n.width,
      h: n.height,
    })
  }

  var smartPath = null
  var sPos = sourcePosition ? sourcePosition.toLowerCase() : 'bottom'
  var tPos = targetPosition ? targetPosition.toLowerCase() : 'top'

  if (obstacles.length > 0) {
    smartPath = computeSmartPath(
      sourceX, sourceY, targetX, targetY,
      sPos, tPos, obstacles,
    )
  }

  var edgePath = null
  var labelX = null
  var labelY = null

  if (smartPath) {
    edgePath = smartPath
    labelX = (sourceX + targetX) / 2
    labelY = (sourceY + targetY) / 2
  } else {
    var _a = getSmoothStepPath({
      sourceX: sourceX, sourceY: sourceY, sourcePosition: sourcePosition,
      targetX: targetX, targetY: targetY, targetPosition: targetPosition,
      borderRadius: 8,
    })
    edgePath = _a[0]
    labelX = _a[1]
    labelY = _a[2]
  }

  // Check animation state first (takes priority over old attackPaths)
  var isAnimEdge = false
  if (animationIndex >= 0) {
    for (var a = 0; a <= animationIndex && a < animationSteps.length; a++) {
      if (animationSteps[a].edgeId === id) {
        isAnimEdge = true
        break
      }
    }
  }

  var isAttack = isAnimEdge || (isSimulating && attackPaths.some(function(p) {
    return p.edgePairs.some(function(e) { return e[0] === source && e[1] === target })
  }))

  var isBlocked = !isAnimEdge && isSimulating && attackPaths.some(function(p) {
    return p.blocked && p.edgePairs.some(function(e) { return e[0] === source && e[1] === target })
  })

  var strokeColor = '#00f0ff'
  var glowFilter = ''
  var animated = selected

  if (isAttack && !isBlocked) {
    strokeColor = '#ff003c'
    glowFilter = 'url(#glow-red)'
    animated = true
  } else if (isBlocked) {
    strokeColor = '#00ff41'
    glowFilter = 'url(#glow-green)'
    animated = true
  }

  return (
    <>
      <defs>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: isAttack ? 3 : 2,
          filter: glowFilter || undefined,
        }}
        className={animated ? 'animate-pulse-glow' : ''}
      />

      {selected && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%) translate(' + labelX + 'px,' + labelY + 'px)',
              pointerEvents: 'all',
            }}
            className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-900/90 border border-cyber-cyan/30 text-cyber-cyan"
          >
            {isAttack && !isBlocked ? 'ATTACK' : isBlocked ? 'BLOCKED' : 'LINK'}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(CustomEdge)
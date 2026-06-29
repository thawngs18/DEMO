import { memo } from 'react'
import useStore from '../../store/useStore'
import { Skull, Shield } from 'lucide-react'

function HackerOverlay() {
  var isSimulating = useStore(function(s) { return s.isSimulating })
  var animationSteps = useStore(function(s) { return s.animationSteps })
  var animationIndex = useStore(function(s) { return s.animationIndex })

  if (!isSimulating) return null

  var currentStep = null
  if (animationIndex >= 0 && animationSteps.length > 0 && animationIndex < animationSteps.length) {
    currentStep = animationSteps[animationIndex]
  }

  var statusIcon = currentStep
    ? (currentStep.status === 'blocked' ? '✖' : '>')
    : '$'

  var statusText = currentStep
    ? (currentStep.status === 'blocked' ? 'BLOCKED' : 'EXECUTING')
    : 'INIT'

  var commandText = currentStep ? (currentStep.action || 'running...') : 'connecting...'
  var explanation = currentStep ? currentStep.explanation : ''
  var nextHint = currentStep ? currentStep.nextHint : ''
  var blockingDetail = currentStep ? currentStep.blockingDetail : ''
  var isBlocked = currentStep && currentStep.status === 'blocked'

  // Dynamic colors based on status
  var activeColor = isBlocked ? 'amber' : 'red'
  var colorClass = 'text-' + activeColor + '-400'
  var bgClass = 'bg-' + activeColor + '-500/20'
  var borderClass = 'border-' + activeColor + '-500/40'
  var shadowClass = 'shadow-[0_0_30px_rgba(' + (isBlocked ? '245,158,11,0.3)' : '239,68,68,0.3)')

  return (
    <div className="absolute top-4 left-4 z-30 pointer-events-none">
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="relative">
            {isBlocked ? (
              // Shield animation when blocked
              <>
                <div className="absolute -inset-2 bg-amber-500/30 rounded-full blur-md animate-pulse" />
                <div className="relative bg-amber-500/20 border border-amber-500/50 rounded-full p-3">
                  <Shield size={28} className="text-amber-400 animate-bounce" />
                </div>
              </>
            ) : (
              // Skull animation during attack
              <>
                <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-md animate-ping" />
                <div className="relative bg-red-500/20 border border-red-500/40 rounded-full p-3">
                  <Skull size={28} className="text-red-400" />
                </div>
              </>
            )}
          </div>

          <div className={'relative bg-slate-900/95 border ' + borderClass + ' rounded-lg px-4 py-3 shadow-2xl max-w-[420px] ' + shadowClass}>
            <div className={'absolute -left-2 top-4 w-4 h-4 bg-slate-900/95 border-l border-b ' + borderClass + ' rotate-45'} />
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className={'text-xs font-mono ' + colorClass + ' font-bold tracking-wider'}>
                {isBlocked ? 'ATTACK BLOCKED' : 'HACKER TERMINAL'}
              </span>
              <span className={'text-[10px] font-mono font-bold ' + (isBlocked ? 'text-green-400' : 'text-green-400')}>
                [{statusText}]
              </span>
            </div>

            {/* Step progress */}
            <div className="text-[10px] text-white/30 font-mono mb-2">
              Step {animationIndex + 1}/{animationSteps.length}
            </div>

            {/* Command line */}
            <div className="font-mono">
              <div className="flex items-start gap-1.5">
                <span className={'text-[12px] font-bold shrink-0 ' + (isBlocked ? 'text-amber-400' : 'text-green-400')}>
                  {statusIcon}
                </span>
                <p className="text-[11px] text-white/90 leading-relaxed break-all">
                  {commandText}
                </p>
              </div>

              {/* Explanation */}
              {explanation && (
                <p className="text-[9px] text-white/60 mt-1.5 ml-5 leading-relaxed">
                  → {explanation}
                </p>
              )}

              {/* Blocked detail - Enhanced */}
              {isBlocked && blockingDetail && (
                <div className="mt-2 ml-5 p-2 bg-green-500/10 border border-green-500/30 rounded">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield size={12} className="text-green-400" />
                    <span className="text-[9px] text-green-400 font-semibold">DEFENSE ACTIVE</span>
                  </div>
                  <p className="text-[9px] text-green-300/80 leading-relaxed">
                    {blockingDetail}
                  </p>
                </div>
              )}

              {/* Generic blocked message (if no detail) */}
              {isBlocked && !blockingDetail && (
                <p className="text-[9px] text-amber-400/70 mt-1.5 ml-5 leading-relaxed">
                  ✖ Security control detected - attack blocked
                </p>
              )}

              {/* Next hint (only when not blocked) */}
              {nextHint && !isBlocked && (
                <p className="text-[9px] text-cyan-400/70 mt-1 ml-5 leading-relaxed">
                  → Next: {nextHint}
                </p>
              )}
            </div>

            {/* Target info */}
            {currentStep && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-[10px] text-white/50 font-mono">
                  <span className="text-cyan-400">target:</span> {currentStep.nodeId}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(HackerOverlay)

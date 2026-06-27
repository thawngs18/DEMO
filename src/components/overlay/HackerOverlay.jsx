import { memo } from 'react'
import useStore from '../../store/useStore'
import { Skull } from 'lucide-react'

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

  return (
    <div className="absolute top-4 left-4 z-30 pointer-events-none">
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-md animate-ping" />
            <div className="relative bg-red-500/20 border border-red-500/40 rounded-full p-3">
              <Skull size={28} className="text-red-400" />
            </div>
          </div>

          <div className="relative bg-slate-900/95 border border-red-500/30 rounded-lg px-4 py-3 shadow-2xl max-w-[420px]">
            <div className="absolute -left-2 top-4 w-4 h-4 bg-slate-900/95 border-l border-b border-red-500/30 rotate-45" />
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-red-400 font-bold tracking-wider">HACKER TERMINAL</span>
              <span className={'text-[10px] font-mono font-bold ' + (currentStep && currentStep.status === 'blocked' ? 'text-amber-400' : 'text-green-400')}>
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
                <span className={'text-[12px] font-bold shrink-0 ' + (currentStep && currentStep.status === 'blocked' ? 'text-amber-400' : 'text-green-400')}>
                  {statusIcon}
                </span>
                <p className="text-[11px] text-white/90 leading-relaxed break-all">
                  {commandText}
                </p>
              </div>
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

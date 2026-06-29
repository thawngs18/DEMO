import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, AlertTriangle, Info, Shield } from 'lucide-react'
import useStore from '../../store/useStore'

var TYPE_CONFIG = {
  success: {
    border: 'border-cyber-red/50',
    shadow: 'shadow-[0_0_20px_rgba(255,0,60,0.15)]',
    icon: AlertTriangle,
    iconColor: 'text-cyber-red',
    label: 'Attack Simulated',
  },
  warning: {
    border: 'border-cyber-green/50',
    shadow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    icon: Shield,
    iconColor: 'text-cyber-green',
    label: 'Attack Mitigated',
  },
  info: {
    border: 'border-cyber-cyan/50',
    shadow: 'shadow-[0_0_20px_rgba(0,240,255,0.15)]',
    icon: Info,
    iconColor: 'text-cyber-cyan',
    label: 'Info',
  },
}

export default function ResultModal() {
  var modalIsOpen = useStore(function(s) { return s.modalIsOpen })
  var content = useStore(function(s) { return s.aiResultContent })
  var setModalOpen = useStore(function(s) { return s.setModalOpen })
  var reRunWithDefense = useStore(function(s) { return s.reRunWithDefense })
  var theme = useStore(function(s) { return s.theme })
  var isDark = theme === 'dark'

  var cfg = TYPE_CONFIG[content?.type] || TYPE_CONFIG.info
  var TypeIcon = cfg.icon

  var overlayBg = isDark ? 'bg-slate-950/60' : 'bg-white/60'
  var modalBg = isDark ? 'bg-slate-950' : 'bg-white'
  var borderColor = isDark ? 'border-slate-800/80' : 'border-slate-200'
  var titleClass = isDark ? 'text-white' : 'text-slate-800'
  var contentClass = isDark ? 'text-gray-300' : 'text-slate-600'
  var closeClass = isDark ? 'text-white/30 hover:text-white' : 'text-slate-400 hover:text-slate-700'

  var handleClose = useCallback(function() {
    setModalOpen(false)
  }, [setModalOpen])

  var handleOverlayClick = useCallback(function(e) {
    if (e.target === e.currentTarget) handleClose()
  }, [handleClose])

  // Show re-run button only for successful attacks (has defense to apply)
  var showRerun = content?.type === 'success' && content?.defense

  return (
    <AnimatePresence>
      {modalIsOpen && content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={'fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ' + overlayBg}
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className={
              modalBg + ' border rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden '
              + cfg.border + ' ' + cfg.shadow
            }
          >
            {/* Header */}
            <div className={'flex items-center justify-between px-5 py-3.5 border-b shrink-0 ' + borderColor}>
              <div className="flex items-center gap-3">
                <Bot size={18} className="text-cyber-red" />
                <span className={'text-sm font-semibold tracking-wide ' + titleClass}>AI NEXUS</span>
              </div>
              <button
                onClick={handleClose}
                className={'transition-colors focus:outline-none ' + closeClass}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Title */}
              <div className="flex items-center gap-2 mb-3">
                <TypeIcon size={14} className={cfg.iconColor} />
                <h2 className={'text-sm font-semibold ' + titleClass}>{content.title}</h2>
              </div>

              {/* Content */}
              <pre className={'text-xs font-mono leading-relaxed whitespace-pre ' + contentClass}>
                {content.body}
              </pre>

              {/* Defense Details Section - Enhanced for mitigated attacks */}
              {content.type === 'warning' && content.defense && (
                <div className="mt-4 p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-cyber-green" />
                    <span className="text-xs font-semibold text-cyber-green">Defense Measures Applied</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {content.defense}
                  </p>
                </div>
              )}

              {/* Re-run with defense button */}
              {showRerun && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={function() { reRunWithDefense(content.defense) }}
                    className="w-full px-4 py-2.5 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 border border-cyber-cyan/30 rounded-lg text-sm font-medium text-cyber-cyan transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield size={16} />
                    Re-run attack with defenses applied
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

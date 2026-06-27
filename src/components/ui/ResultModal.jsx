import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import useStore from '../../store/useStore'

var TYPE_CONFIG = {
  success: {
    border: 'border-cyber-green/50',
    shadow: 'shadow-[0_0_20px_rgba(0,255,65,0.15)]',
    icon: CheckCircle,
    iconColor: 'text-cyber-green',
    label: 'Success',
  },
  warning: {
    border: 'border-cyber-red/50',
    shadow: 'shadow-[0_0_20px_rgba(255,0,60,0.15)]',
    icon: AlertTriangle,
    iconColor: 'text-cyber-red',
    label: 'Warning',
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
                <Bot size={18} className="text-cyber-cyan" />
                <span className={'text-sm font-semibold tracking-wide ' + titleClass}>AI NEXUS</span>
                <span className={'text-[10px] uppercase tracking-widest font-mono ' + cfg.iconColor}>
                  {cfg.label}
                </span>
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

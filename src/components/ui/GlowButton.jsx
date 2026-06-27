import { motion } from 'framer-motion'

export default function GlowButton({
  children, onClick, color, disabled, active, className
}) {
  if (!color) color = 'cyan'
  if (!className) className = ''

  var colorMap = {
    cyan: 'border-cyber-cyan/40 text-cyber-cyan hover:shadow-glow-cyan-sm hover:border-cyber-cyan/70',
    red: 'border-cyber-red/40 text-cyber-red hover:shadow-glow-red-sm hover:border-cyber-red/70',
    green: 'border-cyber-green/40 text-cyber-green hover:shadow-glow-green-sm hover:border-cyber-green/70',
  }

  var activeMap = {
    cyan: 'bg-cyber-cyan/10 shadow-glow-cyan-sm border-cyber-cyan/70',
    red: 'bg-cyber-red/10 shadow-glow-red-sm border-cyber-red/70',
    green: 'bg-cyber-green/10 shadow-glow-green-sm border-cyber-green/70',
  }

  var baseClasses = 'px-4 py-2 rounded-lg border bg-slate-900/40 backdrop-blur-sm font-medium text-sm tracking-wide transition-all duration-200'
  var colorClasses = colorMap[color] || colorMap.cyan
  var activeClasses = active ? (activeMap[color] || activeMap.cyan) : ''
  var stateClasses = disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={baseClasses + ' ' + colorClasses + ' ' + activeClasses + ' ' + stateClasses + ' ' + className}
    >
      {children}
    </motion.button>
  )
}
import { motion } from 'framer-motion'

export default function ScanningSpinner({ label }) {
  if (!label) label = 'Scanning'

  return (
    <div className="flex items-center gap-3 py-1">
      <motion.svg
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="#00f0ff" strokeWidth="2"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      >
        <polygon points="12,2 22,12 12,22 2,12" strokeOpacity="0.4" />
        <polygon points="12,6 18,12 12,18 6,12" strokeOpacity="0.8" />
      </motion.svg>
      <motion.span
        className="text-cyber-cyan font-mono text-xs tracking-widest uppercase"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {label}...
      </motion.span>
    </div>
  )
}
export default function GlassPanel({ children, className, glow }) {
  if (!className) className = ''
  if (!glow) glow = 'none'

  var glowBorder = ''
  if (glow === 'cyan') glowBorder = 'border-cyber-cyan/30 shadow-glow-cyan-sm'
  else if (glow === 'red') glowBorder = 'border-cyber-red/30 shadow-glow-red-sm'
  else if (glow === 'green') glowBorder = 'border-cyber-green/30 shadow-glow-green-sm'
  else glowBorder = 'border-white/10'

  return (
    <div className={'bg-slate-900/60 backdrop-blur-md border ' + glowBorder + ' rounded-xl ' + className}>
      {children}
    </div>
  )
}
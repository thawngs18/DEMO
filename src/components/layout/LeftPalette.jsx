import { NODE_DEFINITIONS } from '../../data/nodeDefinitions'
import useStore from '../../store/useStore'

var RED_HOVER_DARK = 'hover:border-cyber-red/40'
var CYAN_HOVER_DARK = 'hover:border-cyber-cyan/40'
var RED_HOVER_LIGHT = 'hover:border-red-400'
var CYAN_HOVER_LIGHT = 'hover:border-cyan-400'

function PaletteNodeCard({ def }) {
  var theme = useStore(function(s) { return s.theme })
  var isDark = theme === 'dark'
  var Icon = def.icon

  function onDragStart(event) {
    event.dataTransfer.setData('application/reactflow', def.type)
    event.dataTransfer.effectAllowed = 'move'
  }

  var borderHover = def.color === 'red'
    ? (isDark ? RED_HOVER_DARK : RED_HOVER_LIGHT)
    : (isDark ? CYAN_HOVER_DARK : CYAN_HOVER_LIGHT)

  var cardBg = isDark ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/70' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
  var iconClass = isDark
    ? (def.color === 'red' ? 'text-cyber-red' : 'text-cyber-cyan')
    : (def.color === 'red' ? 'text-red-500' : 'text-slate-500')
  var labelClass = isDark ? 'text-gray-300' : 'text-slate-700'

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab border transition-all duration-150 ' + cardBg + ' ' + borderHover + ' active:scale-95'}
    >
      <Icon size={18} className={iconClass} />
      <span className={'text-sm font-medium ' + labelClass}>{def.label}</span>
    </div>
  )
}

export default function LeftPalette() {
  var theme = useStore(function(s) { return s.theme })
  var isDark = theme === 'dark'
  var categories = [...new Set(NODE_DEFINITIONS.map(function(d) { return d.category }))]

  var asideClass = isDark
    ? 'bg-slate-950/60 border-r border-white/5'
    : 'bg-white/90 border-r border-slate-200'
  var titleClass = isDark ? 'text-white/40 border-white/5' : 'text-slate-500 border-slate-200'
  var catClass = isDark ? 'text-white/20' : 'text-slate-400'
  var footClass = isDark ? 'text-white/20 border-white/5' : 'text-slate-400 border-slate-200'

  return (
    <aside className={'h-full flex flex-col backdrop-blur-md ' + asideClass}>
      <div className={'px-4 py-3 border-b ' + titleClass}>
        <h2 className="text-xs font-mono uppercase tracking-widest">Node Palette</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {categories.map(function(cat) {
          return (
            <div key={cat}>
              <h3 className={'text-[10px] font-mono uppercase tracking-widest mb-2 px-1 ' + catClass}>{cat}</h3>
              <div className="space-y-1">
                {NODE_DEFINITIONS.filter(function(d) { return d.category === cat }).map(function(def) {
                  return <PaletteNodeCard key={def.type} def={def} />
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className={'px-4 py-3 border-t ' + footClass}>
        <p className="text-[10px] font-mono text-center">Drag nodes to canvas</p>
      </div>
    </aside>
  )
}
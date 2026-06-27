var PREFIX_MAP = {
  info: '|',
  input: '$',
  success: '+',
  warn: '!',
  attack: 'x',
}

var COLOR_MAP = {
  info: 'text-cyber-cyan',
  input: 'text-cyan-300',
  success: 'text-cyber-green',
  warn: 'text-yellow-400',
  attack: 'text-cyber-red',
}

export default function TerminalLine({ log }) {
  var prefix = PREFIX_MAP[log.type] || '|'

  return (
    <div className={(COLOR_MAP[log.type] || 'text-gray-300') + ' leading-relaxed break-words'}>
      <span className="opacity-60 mr-2 select-none">{prefix}</span>
      <span className="break-words">{log.text}</span>
    </div>
  )
}
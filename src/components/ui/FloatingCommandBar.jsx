import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useAI } from '../../hooks/useAI'
import useStore from '../../store/useStore'

export default function FloatingCommandBar() {
  var [input, setInput] = useState('')
  var modalLoading = useStore(function(s) { return s.modalLoading })
  var theme = useStore(function(s) { return s.theme })
  var { sendMessage } = useAI()

  var isDark = theme === 'dark'

  var containerClass = isDark
    ? 'bg-[#0B0F19]/95 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
    : 'bg-white/90 border-slate-300 shadow-xl'

  var promptClass = isDark ? 'text-cyan-400' : 'text-cyan-600'
  var inputClass = isDark
    ? 'text-white placeholder-white/20'
    : 'text-slate-900 placeholder-slate-400'
  var btnClass = isDark
    ? 'text-cyan-400/60 hover:text-cyan-400'
    : 'text-cyan-600/60 hover:text-cyan-700'

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim() || modalLoading) return
    sendMessage(input.trim(), true)
    setInput('')
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[520px] max-w-[90vw]">
      <form
        onSubmit={handleSubmit}
        className={
          'flex items-center gap-2 px-5 py-3 backdrop-blur-md '
          + 'border-2 rounded-xl font-mono text-sm transition-all duration-200 '
          + 'focus-within:border-cyan-500 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.5)] '
          + containerClass
        }
      >
        <span className={'select-none font-bold ' + promptClass}>&gt;_</span>
        <input
          type="text"
          value={input}
          onChange={function(e) { setInput(e.target.value) }}
          placeholder="Ask AI to generate, scan, simulate..."
          className={'flex-1 bg-transparent text-sm outline-none font-mono ' + inputClass}
          disabled={modalLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || modalLoading}
          className={'transition-colors disabled:opacity-30 disabled:cursor-not-allowed ' + btnClass}
        >
          {modalLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  )
}

import { useEffect } from 'react'
import TopHUD from './TopHUD'
import LeftPalette from './LeftPalette'
import CanvasFlow from '../canvas/CanvasFlow'
import EditPanel from '../panels/EditPanel'
import ScenariosPanel from '../panels/ScenariosPanel'
import FloatingCommandBar from '../ui/FloatingCommandBar'
import ResultModal from '../ui/ResultModal'
import HackerOverlay from '../overlay/HackerOverlay'
import useStore from '../../store/useStore'

export default function AppLayout() {
  const mode = useStore((s) => s.mode)
  const theme = useStore((s) => s.theme)
  const showScenariosPanel = useStore((s) => s.showScenariosPanel)

  useEffect(function() {
    var html = document.documentElement
    var body = document.body
    if (theme === 'dark') {
      html.classList.add('dark')
      body.classList.add('bg-cyber-dark', 'text-white')
      body.classList.remove('bg-gray-50', 'text-slate-900')
    } else {
      html.classList.remove('dark')
      body.classList.add('bg-gray-50', 'text-slate-900')
      body.classList.remove('bg-cyber-dark', 'text-white')
    }
  }, [theme])

  return (
    <>
      <div className="w-screen h-screen overflow-hidden grid"
        style={{
          gridTemplateColumns: "240px 1fr",
          gridTemplateRows: "56px 1fr",
          gridTemplateAreas: '"hud hud" "palette canvas"',
        }}
      >
        <div style={{ gridArea: "hud" }}>
          <TopHUD />
        </div>

        <div style={{ gridArea: "palette" }} className="h-full overflow-hidden">
          <LeftPalette />
        </div>

        <div style={{ gridArea: "canvas" }} className="relative overflow-hidden">
          <CanvasFlow />
          {mode !== "edit" && showScenariosPanel && <ScenariosPanel />}
          {mode === "edit" && <EditPanel />}
          <FloatingCommandBar />
          <HackerOverlay />
        </div>
      </div>
      <ResultModal />
    </>
  )
}
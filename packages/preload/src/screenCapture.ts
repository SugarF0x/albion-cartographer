import { GlobalKeyboardListener } from 'node-global-key-listener'
import type { IGlobalKeyDownMap, IGlobalKeyEvent } from 'node-global-key-listener'
import { Monitor } from 'node-screenshots'

const v = new GlobalKeyboardListener()
const monitors = Monitor.all()

export function screenCapture(onCapture: (data: string, mousePos: [number, number]) => void) {
  function listener(e: IGlobalKeyEvent, down: IGlobalKeyDownMap) {
    if (e.name !== 'MOUSE LEFT') return
    if (e.state !== 'DOWN') return
    if (!down['LEFT CTRL'] || !down['LEFT SHIFT']) return

    for (const monitor of monitors) {
      if (!monitor.isPrimary) continue
      const image = monitor.captureImageSync()
      onCapture(URL.createObjectURL(new Blob([image.toPngSync().buffer], { type: 'image/png' })), e.location!)
      break
    }
  }

  v.addListener(listener)
  return () => v.removeListener(listener)
}

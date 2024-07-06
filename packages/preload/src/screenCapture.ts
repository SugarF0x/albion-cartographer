import { GlobalKeyboardListener } from 'node-global-key-listener'
import type { IGlobalKeyDownMap, IGlobalKeyEvent } from 'node-global-key-listener'
import { Monitor } from 'node-screenshots'

const v = new GlobalKeyboardListener()
const monitors = Monitor.all()

export function screenCapture(onCapture: (data: Buffer, mousePos: [number, number]) => void) {
  function listener(e: IGlobalKeyEvent, down: IGlobalKeyDownMap) {
    if (e.name !== 'MOUSE LEFT') return
    if (e.state !== 'DOWN') return
    if (!down['LEFT CTRL'] || !down['LEFT SHIFT']) return

    monitors.forEach(m => {
      const image = m.captureImageSync()
      onCapture(image.toPngSync(), e.location!)
    })
  }

  v.addListener(listener)
  return () => v.removeListener(listener)
}

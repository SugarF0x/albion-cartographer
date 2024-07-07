import { GlobalKeyboardListener } from 'node-global-key-listener'
import type { IGlobalKeyDownMap, IGlobalKeyEvent } from 'node-global-key-listener'
import { Monitor } from 'node-screenshots'
import { readdirSync, readFileSync } from 'node:fs'

const v = new GlobalKeyboardListener()
const monitors = Monitor.all()

// dev
const files = readdirSync('sampleImages')

function getRandomImage() {
  const randomIndex = Math.floor(Math.random() * files.length)
  const [randomFile] = files.splice(randomIndex, 1)
  return `data:image/png;base64,${readFileSync(`sampleImages/${randomFile}`, 'base64')}`
}
// dev end

export function screenCapture(onCapture: (data: string, mousePos: [number, number]) => void) {
  function listener(e: IGlobalKeyEvent, down: IGlobalKeyDownMap) {
    if (e.name !== 'MOUSE LEFT') return
    if (e.state !== 'DOWN') return
    if (!down['LEFT CTRL'] || !down['LEFT SHIFT']) return

    for (const monitor of monitors) {
      if (!monitor.isPrimary) continue

      // dev
      onCapture(getRandomImage(), [0, 0])
      break
      // dev end

      const image = monitor.captureImageSync()
      onCapture(URL.createObjectURL(new Blob([image.toPngSync().buffer], { type: 'image/png' })), e.location!)
      break
    }
  }

  v.addListener(listener)
  return () => v.removeListener(listener)
}

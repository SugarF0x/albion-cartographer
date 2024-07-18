import { GlobalKeyboardListener } from 'node-global-key-listener'
import type { IGlobalKeyDownMap, IGlobalKeyEvent } from 'node-global-key-listener'
import { Monitor } from 'node-screenshots'
import { readdirSync, readFileSync } from 'node:fs'
import { ref } from 'vue'

const v = new GlobalKeyboardListener()
const monitors = Monitor.all()

const IS_MOCK = process.env.NODE_ENV === 'development'

// dev
const files = IS_MOCK ? readdirSync('sampleImages') : []

function getRandomImage(): [string, [number, number]] {
  const randomIndex = Math.floor(Math.random() * files.length)
  const [randomFile] = files.splice(randomIndex, 1)
  const image = `data:image/png;base64,${readFileSync(`sampleImages/${randomFile}`, 'base64')}`
  const [_, x, y] = randomFile.split('.')[0].split('-')
  return [image, [Number(x), Number(y)]]
}
// dev end

export const onScreenCapture = ref<null | ((data: string, mousePos: [number, number]) => void)>(null)

function listener(e: IGlobalKeyEvent, down: IGlobalKeyDownMap) {
  if (e.state !== 'DOWN') return
  if (e.name !== 'MOUSE LEFT') return
  if (!down['LEFT CTRL'] || !down['LEFT SHIFT']) return

  for (const monitor of monitors) {
    if (!monitor.isPrimary) continue

    // dev
    if (IS_MOCK) {
      onScreenCapture.value?.(...getRandomImage())
      break
    }
    // dev end

    const image = monitor.captureImageSync()
    onScreenCapture.value?.(URL.createObjectURL(new Blob([image.toPngSync().buffer], { type: 'image/png' })), e.location!)
    break
  }
}

void v.addListener(listener)
import { Monitor } from 'node-screenshots'
import { GlobalKeyboardListener } from 'node-global-key-listener'
import type { BrowserWindow } from 'electron'

const v = new GlobalKeyboardListener()
const monitors = Monitor.all()

export default function() {
  return

  v.addListener((e, down) => {
    if (e.name !== 'MOUSE LEFT') return
    if (e.state !== 'DOWN') return
    if (!down['LEFT CTRL'] || !down['LEFT SHIFT']) return

    monitors.forEach(m => {
      console.log(e.location)
    })
  })
}

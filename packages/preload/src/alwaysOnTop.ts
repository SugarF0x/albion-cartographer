import { ipcRenderer } from 'electron'

export function setAppAlwaysOnTop(value: boolean) {
  ipcRenderer.send('set-always-on-top', value)
}
import { getPublicAssetPath } from '/@/getPublicAssetPath'
import { useLocalStorage } from '@vueuse/core'

const TRACKS = {
  alert: new Audio(getPublicAssetPath('/sounds/alert.mp3')),
  error: new Audio(getPublicAssetPath('/sounds/error.mp3')),
  notification: new Audio(getPublicAssetPath('/sounds/notification.mp3')),
  open: new Audio(getPublicAssetPath('/sounds/open.mp3')),
} as const

export const audioVolume = useLocalStorage('audioVolume', .5)

export function play(track: keyof typeof TRACKS) {
  for (const key in TRACKS) {
    const audio = TRACKS[key as keyof typeof TRACKS]
    audio.pause()
    audio.currentTime = 0
    audio.volume = audioVolume.value
  }

  TRACKS[track].play()
}

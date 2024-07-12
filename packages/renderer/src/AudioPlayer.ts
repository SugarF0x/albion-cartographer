import { getPublicAssetPath } from '/@/getPublicAssetPath'
import { useLocalStorage } from '@vueuse/core'
import { watchEffect } from 'vue'
import { z } from 'zod'

const TRACKS = {
  alert: new Audio(getPublicAssetPath('/sounds/alert.mp3')),
  error: new Audio(getPublicAssetPath('/sounds/error.mp3')),
  notification: new Audio(getPublicAssetPath('/sounds/notification.mp3')),
  open: new Audio(getPublicAssetPath('/sounds/open.mp3')),
} as const

const MIN_VOLUME = 0
const MAX_VOLUME = 1
const DEFAULT_VOLUME = (MAX_VOLUME - MIN_VOLUME) / 2

const volume = useLocalStorage('audioVolume', DEFAULT_VOLUME)

watchEffect(() => {
  try {
    z.number().min(MIN_VOLUME).max(MAX_VOLUME).parse(volume.value)
    for (const key in TRACKS) {
      const audio = TRACKS[key as keyof typeof TRACKS]
      audio.volume = volume.value
    }
  } catch (e) {
    console.error(e)
    volume.value = DEFAULT_VOLUME
  }
})

let playerPromise = Promise.resolve()
async function stop() {
  await playerPromise
  for (const key in TRACKS) {
    const audio = TRACKS[key as keyof typeof TRACKS]
    audio.pause()
    audio.currentTime = 0
  }
}

async function play(track: keyof typeof TRACKS) {
  await stop()
  playerPromise = TRACKS[track].play()
}

export default {
  MIN_VOLUME,
  MAX_VOLUME,
  DEFAULT_VOLUME,
  play,
  volume,
}

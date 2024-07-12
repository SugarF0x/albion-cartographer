import { getPublicAssetPath } from '/@/getPublicAssetPath'
import { useLocalStorage } from '@vueuse/core'
import { reactive, watchEffect } from 'vue'
import { z } from 'zod'

class AudioPlayer {
  private tracks = {
    alert: new Audio(getPublicAssetPath('/sounds/alert.mp3')),
    error: new Audio(getPublicAssetPath('/sounds/error.mp3')),
    notification: new Audio(getPublicAssetPath('/sounds/notification.mp3')),
    open: new Audio(getPublicAssetPath('/sounds/open.mp3')),
  } as const

  readonly MIN_VOLUME = 0
  readonly MAX_VOLUME = 1
  readonly DEFAULT_VOLUME = (this.MAX_VOLUME - this.MIN_VOLUME) / 2

  volume = useLocalStorage('audioVolume', this.DEFAULT_VOLUME)

  constructor() {
    watchEffect(() => {
      try {
        z.number().min(this.MIN_VOLUME).max(this.MAX_VOLUME).parse(this.volume.value)
        for (const key in this.tracks) {
          const audio = this.tracks[key as keyof typeof this.tracks]
          audio.volume = this.volume.value
        }
      } catch (e) {
        console.error(e)
        this.volume.value = this.DEFAULT_VOLUME
      }
    })
  }

  private playerPromise = Promise.resolve()

  private async stop() {
    await this.playerPromise
    for (const key in this.tracks) {
      const audio = this.tracks[key as keyof typeof this.tracks]
      audio.pause()
      audio.currentTime = 0
    }
  }

  async play(track: keyof typeof this.tracks) {
    await this.stop()
    this.playerPromise = this.tracks[track].play()
  }
}

export default reactive(new AudioPlayer())

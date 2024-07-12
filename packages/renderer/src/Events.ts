import { reactive } from 'vue'
import AudioPlayer from '/@/AudioPlayer'

class Events {
  log: string[] = []

  push(message: { toString: () => string }, type?: Parameters<typeof AudioPlayer.play>[0]) {
    this.log.push(String(message))
    if (type) void AudioPlayer.play(type)
  }
}

export default reactive(new Events())

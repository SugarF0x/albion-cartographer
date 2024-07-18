import { onBeforeUnmount, onMounted } from 'vue'
import { setOnScreenCapture } from '#preload'
import { parse } from '/@/services/ImageProcessor/parser'
import { preprocessImageForOCR } from '/@/services/ImageProcessor/processor'
import { read } from '/@/services/ImageProcessor/reader'
import Navigator from '/@/services/Navigator'
import Events from '/@/services/Events'

export default function useImageProcessor() {
  async function process(data: string, position: [number, number]) {
    try {
      const images = await parse(data, position)

      const [zoneName, portalName, portalTime] = await Promise.all([
        preprocessImageForOCR(images.zoneNameImage),
        preprocessImageForOCR(images.portalNameImage),
        preprocessImageForOCR(images.portalTimeImage, { time: true }),
      ])

      const source = String(await read(zoneName))
      const target = String(await read(portalName))
      const time = Number(await read(portalTime))

      const expiration = new Date(Date.now() + time).toISOString()
      Navigator.links.push({ source, target, expiration })
    } catch (e) {
      Events.push(String(e), 'error')
    }
  }

  onMounted(() => { setOnScreenCapture(process) })
  onBeforeUnmount(() => { setOnScreenCapture(null) })
}
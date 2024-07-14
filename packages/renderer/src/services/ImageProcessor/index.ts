import { onBeforeUnmount, onMounted } from 'vue'
import { screenCapture } from '#preload'
import { parse } from '/src/services/ImageProcessor/parser'
import { preprocessImageForOCR } from '/src/services/ImageProcessor/processor'
import { read } from '/src/services/ImageProcessor/reader'
import Navigator from '/src/services/Navigator'
import Events from '/src/services/Events'

export default function useImageProcessor() {
  onMounted(() => {
    const unsubscribe = screenCapture(async (data, position) => {
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
        Navigator.push({ source, target, expiration })
      } catch (e) {
        Events.push(String(e), 'error')
      }
    })

    onBeforeUnmount(unsubscribe)
  })
}
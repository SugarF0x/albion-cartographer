<script lang="ts" setup>
import { chart } from './chart'
import { onBeforeUnmount, onMounted } from 'vue'
import { screenCapture } from '#preload'
import { parse } from '/@/parser'
import { preprocessImageForOCR } from '/@/processor'
import { read } from '/@/reader'
import { addLink } from '/@/linksStore'

onMounted(() => {
  const element = chart()
  if (!element) return

  element.removeAttribute('width')
  element.removeAttribute('height')
  document.querySelector('#chart')?.appendChild(element)

  const unsubscribe = screenCapture(async (data, position) => {
    const images = await parse(data, position)

    const [zoneName, portalName, portalTime] = await Promise.all([
      preprocessImageForOCR(images.zoneNameImage),
      preprocessImageForOCR(images.portalNameImage),
      preprocessImageForOCR(images.portalTimeImage, { time: true }),
    ])

    const source = String(await read(zoneName))
    const target = String(await read(portalName))
    const time = Number(await read(portalTime))

    addLink(source, target, time)
  })

  onBeforeUnmount(unsubscribe)
})
</script>

<template>
  <div class="container">
    <div id="chart" />
    <div class="controls-container">
      some controls here
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
}

.controls-container {
  margin: 24px;
  max-width: min(50%, 600px);
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  :deep(#controls) {
    flex-grow: 1;
  }
}
</style>

<style lang="scss">
#chart {
  display: flex;
  justify-content: center;
  flex-grow: 1;
  max-height: 100vh;
}
</style>

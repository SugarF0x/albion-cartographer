<script lang="ts" setup>
import { chart } from './chart'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { screenCapture } from '#preload'
import { parse } from '/@/parser'
import { preprocessImageForOCR } from '/@/processor'
import { read } from '/@/reader'
import { addLink } from '/@/linksStore'
import ZoneSelector from './ZoneSelector.vue'
import { findShortestPath, pathfinderRoute } from '/@/pathing'
import { play } from '/@/audioPlayer'

const from = ref('')
const to = ref('')

function findPath() {
  if (!from.value || !to.value) return
  console.log('searching')
  findShortestPath(from.value, to.value)
}

onMounted(() => {
  const element = chart()
  if (!element) return

  element.removeAttribute('width')
  element.removeAttribute('height')
  document.querySelector('#chart')?.appendChild(element)

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

      addLink(source, target, time)
    } catch (e) {
      play('error')
    }
  })

  onBeforeUnmount(unsubscribe)
})
</script>

<template>
  <div class="container">
    <div id="chart" />
    <div class="controls-container">
      from
      <ZoneSelector v-model="from" />
      to
      <ZoneSelector v-model="to" />
      <button @click="findPath()">search</button>
      <button @click="pathfinderRoute.length = 0">clear</button>
      path
      {{ pathfinderRoute.map(e => e.target) }}
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

  background-color: #323B44;
  color: white;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #5d6876;
  box-sizing: border-box;

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

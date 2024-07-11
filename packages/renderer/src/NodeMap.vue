<script lang="ts" setup>
import { chart } from './chart'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { screenCapture } from '#preload'
import { parse } from '/@/parser'
import { preprocessImageForOCR } from '/@/processor'
import { read } from '/@/reader'
import { activeLinksMap, addLink, CustomLinkDataSchema, storeLinks } from '/@/linksStore'
import ZoneSelector from './ZoneSelector.vue'
import { findShortestPath, pathfinderRoute } from '/@/pathing'
import { play, audioVolume } from '/@/audioPlayer'
import { eventLog } from './eventLog'
import { takeRight } from 'lodash'
import { z } from 'zod'
import { isBefore } from 'date-fns'

const from = ref('LYMHURST')
const to = ref('SEBOS_AVOIROM')
const autoSearch = ref(false)

watch(activeLinksMap, () => {
  if (!autoSearch.value) return
  findPath()
})

function findPath() {
  if (!from.value || !to.value) return
  const didFind = findShortestPath(from.value, to.value)
  if (autoSearch.value && didFind) {
    eventLog.push(`Found path: ${from.value} > ${to.value}`)
    play('alert')
    autoSearch.value = false
  }
}

const importValue = ref('')

function exportData() {
  importValue.value = btoa(JSON.stringify(storeLinks.value))
  eventLog.push('Pushed current state for export')
  play('alert')
}

function importData() {
  try {
    const decoded = atob(importValue.value)
    const data = JSON.parse(decoded)
    const validatedData = z.array(CustomLinkDataSchema).parse(data)
    const filteredData = validatedData.filter(e => isBefore(new Date(), new Date(e.expiration)))
    if (!filteredData.length) return eventLog.push('Failed to import: data is expired')
    for (const item of filteredData) {
      const expiration = new Date(item.expiration).valueOf() - Date.now()
      addLink(item.source, item.target, expiration, true)
    }
    eventLog.push('Successfully imported data')
    play('open')
  } catch(e) {
    eventLog.push(String(e) + ' when importing value')
  }
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
      eventLog.push(String(e))
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
      audio volume
      <input v-model="audioVolume" type="range" min="0" max="1" step="0.01" />
      from
      <ZoneSelector v-model="from" />
      to
      <ZoneSelector v-model="to" />
      <button :disabled="autoSearch" @click="findPath()">search</button>
      auto seach
      <input v-model="autoSearch" type="checkbox" />
      <button @click="pathfinderRoute.length = 0">clear</button>
      <button @dblclick="storeLinks = []">clear storage</button>
      path
      <pre>{{ JSON.stringify(pathfinderRoute.map(e => e.target), null, 2) }}</pre>
      events (last 25)
      <pre>{{ JSON.stringify(takeRight(eventLog, 25), null, 2) }}</pre>

      <div style="flex-grow: 1" />

      <textarea v-model="importValue" rows="10" />
      <button :disabled="!importValue" @click="importData">import</button>
      <button @click="exportData">export</button>
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

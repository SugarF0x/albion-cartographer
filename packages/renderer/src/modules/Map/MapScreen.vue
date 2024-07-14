<script lang="ts" setup>
import { ref, watch } from 'vue'
import { takeRight } from 'lodash'
import Navigator from '/@/services/Navigator'
import ZoneSelector from '/@/modules/Map/ZoneSelector.vue'
import AudioPlayer from '/@/services/AudioPlayer'
import Events from '/@/services/Events'
import ZoneGraph from '/@/modules/Map/ZoneGraph.vue'
import getSampleData from '/@/data/sampleData'
import useImageProcessor from '/@/services/ImageProcessor'

useImageProcessor()

const from = ref('LYMHURST')
const to = ref('SEBOS_AVOIROM')
const autoSearch = ref(false)

watch(Navigator.links, () => {
  if (!autoSearch.value) return
  findPath()
})

function findPath() {
  if (!from.value || !to.value) return
  const previousPath = [...Navigator.pathfinderRoute.value]
  const didFind = Navigator.findShortestPath(from.value, to.value)
  if (autoSearch.value && didFind) {
    if (previousPath.length !== 0 && previousPath.length <= Navigator.pathfinderRoute.value.length) return
    Events.push(`Found path: ${from.value} > ${to.value}`, 'alert')
  }
}

const importValue = ref('')

function exportData() {
  importValue.value = Navigator.export()
  Events.push('Pushed current state for export', 'alert')
}

function importData() {
  Navigator.import(importValue.value)
}
</script>

<template>
  <div class="container">
    <div id="chart">
      <ZoneGraph @from="e => from = e" @to="e => to = e" />
    </div>
    <div class="controls-container">
      audio volume
      <input v-model.number="AudioPlayer.volume.value" type="range" :min="AudioPlayer.MIN_VOLUME" :max="AudioPlayer.MAX_VOLUME" :step="(AudioPlayer.MAX_VOLUME - AudioPlayer.MIN_VOLUME) / 100" />
      from
      <ZoneSelector v-model="from" />
      to
      <ZoneSelector v-model="to" />
      <button :disabled="autoSearch" @click="findPath()">search</button>
      auto seach
      <input v-model="autoSearch" type="checkbox" />
      <button @click="Navigator.pathfinderRoute.value.length = 0">clear</button>
      <button @dblclick="Navigator.flush">clear storage</button>
      path
      <pre>{{ JSON.stringify(Navigator.pathfinderRoute.value.map(e => e.target), null, 2) }}</pre>
      events (last 25)
      <pre>{{ JSON.stringify(takeRight(Events.log, 25), null, 2) }}</pre>

      <div style="flex-grow: 1" />

      <textarea v-model="importValue" rows="10" />
      <button :disabled="!importValue" @click="importData">import</button>
      <button @click="exportData">export</button>
      <button @click="importValue = getSampleData()">paste sample</button>
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

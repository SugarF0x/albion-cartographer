<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { takeRight } from 'lodash'
import Navigator from '/@/services/Navigator'
import ZoneSelector from '/@/modules/Map/ZoneSelector.vue'
import AudioPlayer from '/@/services/AudioPlayer'
import Events from '/@/services/Events'
import ZoneGraph from '/@/modules/Map/ZoneGraph.vue'
import getSampleData from '/@/data/sampleData'
import useImageProcessor from '/@/services/ImageProcessor'
import { Road, Zone } from '/@/data/zone'
import NodeMenu from '/@/modules/Map/NodeMenu.vue'

useImageProcessor()

const autoSearch = ref(false)

watch(Navigator.links, () => {
  if (!autoSearch.value) return
  const previousPath = [...Navigator.pathfinderRoute.value]
  const didFind = Navigator.findShortestPath(Navigator.pathfinder.from, Navigator.pathfinder.to)
  if (autoSearch.value && didFind) {
    if (previousPath.length !== 0 && previousPath.length <= Navigator.pathfinderRoute.value.length) return
    Events.push(`Found path: ${Navigator.pathfinder.from} > ${Navigator.pathfinder.to}`, 'alert')
  }
})

const importValue = ref('')

function exportData() {
  importValue.value = Navigator.export()
  Events.push('Pushed current state for export', 'alert')
}

function importData() {
  Navigator.import(importValue.value)
}

const mappedPercentage = computed(() => {
  const mappedRoads = Navigator.links.value.reduce((acc, val) => {
    if (val.source in Road) acc.add(val.source)
    if (val.target in Road) acc.add(val.target)
    return acc
  }, new Set<string>())

  return Math.floor((mappedRoads.size / Object.values(Road).length) * 1000) / 10 + '%'
})

const menuState = reactive({ x: 0, y: 0, open: false, node: Zone.LYMHURST as string })
window.addEventListener('click', () => { menuState.open = false })
function onNodeClick(node: string, event: PointerEvent) {
  event.stopPropagation()
  menuState.x = event.clientX
  menuState.y = event.clientY
  menuState.open = true
  menuState.node = node
}

function clearPath() {
  Navigator.pathfinderRoute.value.length = 0
  Navigator.pathfinder.from = ''
  Navigator.pathfinder.to = ''
}
</script>

<template>
  <div class="container">
    <div id="chart">
      <zone-graph @click="onNodeClick" />
    </div>
    <div class="controls-container">
      <div>Mapped: {{ mappedPercentage }}</div>
      audio volume
      <input v-model.number="AudioPlayer.volume.value" type="range" :min="AudioPlayer.MIN_VOLUME" :max="AudioPlayer.MAX_VOLUME" :step="(AudioPlayer.MAX_VOLUME - AudioPlayer.MIN_VOLUME) / 100" />
      from
      <zone-selector position="from" />
      to
      <zone-selector position="to" />
      auto seach
      <input v-model="autoSearch" type="checkbox" />
      <button @click="clearPath">clear</button>
      <button @dblclick="Navigator.flush">clear storage</button>
      path (expires in: {{ Navigator.pathExpiration.value }})
      <pre>{{ JSON.stringify(Navigator.pathfinderRoute.value.map(e => e.target), null, 2) }}</pre>
      events (last 25)
      <pre>{{ JSON.stringify(takeRight(Events.log, 25), null, 2) }}</pre>

      <div style="flex-grow: 1" />

      <textarea v-model="importValue" rows="10" />
      <button :disabled="!importValue" @click="importData">import</button>
      <button @click="exportData">export</button>
      <button @click="importValue = getSampleData()">paste sample</button>

      <node-menu v-bind="menuState" />
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
  max-width: min(50%, 600px);
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  background-color: #323B44;
  color: white;
  padding: 16px;
  border-left: 4px solid #5d6876;
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

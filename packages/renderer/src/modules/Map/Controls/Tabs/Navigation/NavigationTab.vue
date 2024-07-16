<script setup lang="ts">
import Navigator from '/@/services/Navigator'
import { ref, watch } from 'vue'
import Events from '/@/services/Events'
import ZoneSelector from '/@/modules/Map/Controls/Tabs/Navigation/ZoneSelector.vue'
import PathfinderRoute from '/@/modules/Map/Controls/Tabs/Navigation/PathfinderRoute.vue'

function clearPath() {
  Navigator.pathfinderRoute.value.length = 0
  Navigator.pathfinder.from = ''
  Navigator.pathfinder.to = ''
}

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
</script>

<template>
  from
  <zone-selector position="from" />
  to
  <zone-selector position="to" />
  auto seach
  <input v-model="autoSearch" type="checkbox" />
  <button @click="clearPath">clear</button>
  <button @dblclick="Navigator.flush">clear storage</button>
  <pathfinder-route />
</template>

<style scoped lang="scss">

</style>
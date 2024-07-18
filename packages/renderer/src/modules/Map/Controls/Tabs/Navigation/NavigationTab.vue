<script setup lang="ts">
import Navigator from '/@/services/Navigator'
import { ref, watch } from 'vue'
import Events from '/@/services/Events'
import ZoneSelector from '/@/modules/Map/Controls/Tabs/Navigation/ZoneSelector.vue'
import PathfinderRoute from '/@/modules/Map/Controls/Tabs/Navigation/PathfinderRoute.vue'
import FavoriteNodes from '/@/modules/Map/Controls/Tabs/Navigation/FavoriteNodes.vue'

function clearPath() {
  Navigator.pathfinder.route.value.length = 0
  Navigator.pathfinder.link.from = ''
  Navigator.pathfinder.link.to = ''
}

const autoSearch = ref(false)
const notifyFavoritesLinkFound = ref(false)

watch(Navigator.links.all, () => {
  if (!autoSearch.value) return
  const previousPath = [...Navigator.pathfinder.route.value]
  const didFind = Navigator.pathfinder.search()
  if (autoSearch.value && didFind) {
    if (previousPath.length !== 0 && previousPath.length <= Navigator.pathfinder.route.value.length) return
    Events.push(`Found path: ${Navigator.pathfinder.link.from} > ${Navigator.pathfinder.link.to}`, 'alert')
  }
})

watch(Navigator.links.all, value => {
  if (!notifyFavoritesLinkFound.value) return
  const lastItem = value.at(-1)
  if (!lastItem) return

  if (Navigator.nodes.favorites.value.includes(lastItem.target)) {
    Events.push(`Found connection to: ${lastItem.target} < ${lastItem.source}`, 'alert')
  }
})
</script>

<template>
  from
  <zone-selector position="from" />
  to
  <zone-selector position="to" />
  <div class="flex">
    <input v-model="autoSearch" type="checkbox" />
    auto search
  </div>
  <div class="flex">
    <input v-model="notifyFavoritesLinkFound" type="checkbox" />
    notify on favorites connection found
  </div>
  <button @click="clearPath">clear</button>
  <pathfinder-route />
  <div style="flex: 1" />
  <favorite-nodes />
</template>

<style scoped lang="scss">
.flex {
  display: flex;
  gap: 4px;
}
</style>
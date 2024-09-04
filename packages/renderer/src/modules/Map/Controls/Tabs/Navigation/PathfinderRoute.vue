<script setup lang="ts">
import Navigator from '/@/services/Navigator'
import { formatDistanceToNow } from 'date-fns'
import { computed, ref, watch } from 'vue'

const isExitRouteInverted = ref(false)
const exitRouteIndex = ref(0)
watch(Navigator.pathfinder.exitRoutes, () => { exitRouteIndex.value = 0 })

const isExitRoutesMode = computed(() => Navigator.pathfinder.exitRoutes.value.length)

const route = computed(() => {
  if (!isExitRoutesMode.value) return Navigator.pathfinder.route.value

  if (isExitRouteInverted.value) {
    const reversedRoute = Navigator.pathfinder.exitRoutes.value[exitRouteIndex.value].toReversed()
    return reversedRoute.map(link => ({ ...link, source: link.target, target: link.source }))
  }

  return Navigator.pathfinder.exitRoutes.value[exitRouteIndex.value]
})

watch(route, value => {
  if (!isExitRoutesMode.value) return
  Navigator.pathfinder.route.value = value
})
</script>

<template>
  <div v-if="!route.length">No path found</div>
  <template v-else>
    <div v-if="isExitRoutesMode" class="exits-list-controls">
      <button :disabled="exitRouteIndex - 1 < 0" @click="exitRouteIndex--">&triangleleft;</button>
      <span>{{ exitRouteIndex + 1 }}</span>
      <button :disabled="exitRouteIndex + 1 >= Navigator.pathfinder.exitRoutes.value.length" @click="exitRouteIndex++">&triangleright;</button>
      <button @click="isExitRouteInverted = !isExitRouteInverted">invert</button>
    </div>
    <table class="path-table">
      <thead>
        <tr>
          <th>from</th>
          <th>to</th>
          <th>expires in</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="link of route" :key="link.source">
          <td>{{ link.source }}</td>
          <td>{{ link.target }}</td>
          <td>
            <template v-if="link.expiration !== 'never'">{{ formatDistanceToNow(new Date(link.expiration)) }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </template>
</template>

<style scoped lang="scss">
.path-table {
  border-collapse: collapse;
  border: 1px solid;
  font-size: min(1vw, 20px);

  td, th {
    border: 1px solid;
    padding: 4px;
  }
}

.exits-list-controls {
  display: flex;
  gap: 4px;
}
</style>
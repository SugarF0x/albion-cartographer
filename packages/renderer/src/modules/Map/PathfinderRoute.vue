<script setup lang="ts">
import Navigator from '/@/services/Navigator'
import { watch } from 'vue'
import { formatDistanceToNow } from 'date-fns'

watch(Navigator.pathfinderRoute, console.log)
</script>

<template>
  <div v-if="!Navigator.pathfinderRoute.value.length">No path found</div>
  <table v-else class="path-table">
    <thead>
      <tr>
        <th>from</th>
        <th>to</th>
        <th>expires in</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="link of Navigator.pathfinderRoute.value" :key="link.source">
        <td>{{ link.source }}</td>
        <td>{{ link.target }}</td>
        <td v-if="link.expiration !== 'never'">{{ formatDistanceToNow(new Date(link.expiration)) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss">
.path-table {
  border-collapse: collapse;
  border: 1px solid;

  td, th {
    border: 1px solid;
    padding: 4px;
  }
}
</style>
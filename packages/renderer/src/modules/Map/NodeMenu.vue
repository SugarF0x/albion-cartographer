<script setup lang="ts">
import Navigator from '/@/services/Navigator'
import { watch } from 'vue'

const props = defineProps<{
  x: number
  y: number
  open: boolean
  node: string
}>()

watch(() => props.open, () => { Navigator.lastInspectedNode.value = props.node })
</script>

<template>
  <div v-if="open" id="node-menu" :style="{ top: String(y) + 'px', left: String(x) + 'px' }">
    <div class="title">{{ node }}</div>
    <button @click="Navigator.pathfinder.from = node">from</button>
    <button @click="Navigator.pathfinder.to = node">to</button>
  </div>
</template>

<style scoped lang="scss">
#node-menu {
  position: absolute;
  background-color: #323B44;
  color: white;
  padding: 4px;
  border: 1px solid #5d6876;
  box-sizing: border-box;
  gap: 8px;
  display: flex;
  flex-direction: column;
}

.title {
  border-bottom: 1px solid #5d6876;
}
</style>
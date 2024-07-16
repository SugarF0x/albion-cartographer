<script lang="ts" setup>
import { reactive } from 'vue'
import MapGraph from '/src/modules/Map/MapGraph.vue'
import useImageProcessor from '/@/services/ImageProcessor'
import { Zone } from '/@/data/zone'
import NodeMenu from '/src/modules/Map/NodeMenu.vue'
import MapControls from '/@/modules/Map/Controls/MapControls.vue'

useImageProcessor()

const menuState = reactive({ x: 0, y: 0, open: false, node: Zone.LYMHURST as string })
window.addEventListener('click', () => { menuState.open = false })
function onNodeClick(node: string, event: MouseEvent) {
  event.stopPropagation()
  menuState.x = event.clientX
  menuState.y = event.clientY
  menuState.open = true
  menuState.node = node
}
</script>

<template>
  <div class="container">
    <map-graph @click="onNodeClick" />
    <map-controls />

    <node-menu v-bind="menuState" />
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
</style>

<style lang="scss">

</style>

<script setup lang="ts">
import { takeRight } from 'lodash'
import Events from '/@/services/Events'
import ControlsPanel from '/@/services/ControlsPanel'
import { computed, ref } from 'vue'
import { setAppAlwaysOnTop } from '#preload'

const log = computed(() => takeRight(Events.log, 25).join('\n'))

const isAppAlwaysOnTop = ref(false)
function toggleAppAlwaysOnTop() {
  setAppAlwaysOnTop(!isAppAlwaysOnTop.value)
  isAppAlwaysOnTop.value = !isAppAlwaysOnTop.value
}
</script>

<template>
  <button @click="ControlsPanel.isOpen.value = false">hide controls</button>
  toggle always on top:
  <button @click="toggleAppAlwaysOnTop">{{ String(isAppAlwaysOnTop) }}</button>
  events (last 25)
  <pre class="event-log">{{ log }}</pre>
</template>

<style scoped lang="scss">
.event-log {
  font-size: 1vw;
}
</style>
<script setup lang="ts">
import { takeRight } from 'lodash'
import Events from '/@/services/Events'
import { computed } from 'vue'

const log = computed(() => takeRight(Events.log, 25).join('\n'))
</script>

<template>
  events (last 25)
  <pre class="event-log">{{ log }}</pre>
</template>

<style scoped lang="scss">
.event-log {
  font-size: 1vw;
}
</style>
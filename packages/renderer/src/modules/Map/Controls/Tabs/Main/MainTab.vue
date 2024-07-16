<script setup lang="ts">
import { takeRight } from 'lodash'
import Events from '/@/services/Events'
</script>

<template>
  events (last 25)
  <pre>{{ JSON.stringify(takeRight(Events.log, 25), null, 2) }}</pre>
</template>

<style scoped lang="scss">

</style>
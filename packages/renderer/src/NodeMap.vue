<script lang="ts" setup>
import { chart } from './chart'
import { Road, Zone } from '/@/data/zone'
import { onBeforeUnmount, onMounted } from 'vue'
import { screenCapture } from '#preload'

onMounted(() => {
  const [element, links] = chart()
  if (!element) return

  element.removeAttribute('width')
  element.removeAttribute('height')
  document.querySelector('#chart')?.appendChild(element)

  const stack = [
    { source: Zone.LYMHURST, target: Road.COROS_ALIEAM }, { source: Road.COROS_ALIEAM, target: Zone.LYMHURST },
    { source: Road.COROS_ALIEAM, target: Road.CASES_UGUMLOS }, { source: Road.CASES_UGUMLOS, target: Road.COROS_ALIEAM },
    { source: Road.CASES_UGUMLOS, target: Road.COUES_EXAKROM }, { source: Road.COUES_EXAKROM, target: Road.CASES_UGUMLOS },
    { source: Road.COUES_EXAKROM, target: Road.CERES_IOOINUM }, { source: Road.CERES_IOOINUM, target: Road.COUES_EXAKROM },
    { source: Road.CERES_IOOINUM, target: Zone.PEN_GENT }, { source: Zone.PEN_GENT, target: Road.CERES_IOOINUM },
  ]

  const unsubscribe = screenCapture(async () => {
    links.push(stack.shift()!, stack.shift()!)
  })

  onBeforeUnmount(unsubscribe)
})
</script>

<template>
  <div class="container">
    <div id="chart" />
    <div class="controls-container">
      some controls here
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
  margin: 24px;
  max-width: min(50%, 600px);
  display: flex;
  flex-direction: column;
  flex-grow: 1;

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

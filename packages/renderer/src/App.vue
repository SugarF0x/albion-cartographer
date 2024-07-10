<script lang="ts" setup>
import { screenCapture } from '#preload'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { parse } from './parser'
import { preprocessImageForOCR } from './processor'
import { read } from './reader'

const imgData = ref<string[]>([])

onMounted(() => {
  const unsubscribe = screenCapture(async (data, position) => {
    imgData.value = [data]
    const images = await parse(data, position)

    imgData.value.push(images.zoneImage, images.portalImage)

    const items = await Promise.all([
      preprocessImageForOCR(images.zoneNameImage),
      preprocessImageForOCR(images.portalNameImage),
      preprocessImageForOCR(images.portalTimeImage, { time: true }),
    ])

    imgData.value.push(...items.map(e => e.image))
    const [zoneName, portalName, portalTime] = items

    console.log(await read(zoneName))
    console.log(await read(portalName))
    console.log(await read(portalTime))
  })

  onBeforeUnmount(unsubscribe)
})
</script>

<template>
  <h1>cock and balls</h1>
  <img v-for="img of imgData" :key="img" :src="img" alt="" style="max-width: 800px; max-height: 400px;">
</template>

<style>

</style>

<script lang="ts" setup>
import { screenCapture } from '#preload'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { parse } from './parser'
import { preprocessImageForOCR } from './processor'

const imgData = ref<string[]>([])

onMounted(() => {
  const unsubscribe = screenCapture(async (data, position) => {
    imgData.value = [data]
    const images = await parse(data, position)

    imgData.value.push(images.zoneImage, images.portalImage)
    imgData.value.push(await preprocessImageForOCR(images.zoneNameImage))
    imgData.value.push(await preprocessImageForOCR(images.portalNameImage))
    imgData.value.push(await preprocessImageForOCR(images.portalTimeImage))
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

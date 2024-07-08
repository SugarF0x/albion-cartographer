<script lang="ts" setup>
import { screenCapture } from '#preload'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { parse } from './parser'

const imgData = ref<string[]>([])

onMounted(() => {
  const unsubscribe = screenCapture((data, position) => {
    console.log(position)
    parse(data, position).then(items => imgData.value = [data, ...items])
    // preprocessImageForOCR(data).then(processed => {
    //   imgData.value.push(data)
    //   imgData.value.push(processed)
    // })
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

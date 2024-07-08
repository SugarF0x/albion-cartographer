<script lang="ts" setup>
import { screenCapture } from '#preload'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { validate } from './imageValidator'

const imgData = ref<string[]>([])

onMounted(() => {
  const unsubscribe = screenCapture((data /*position*/) => {
    validate(data).then(console.log)
    imgData.value.unshift(data)
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
  <img v-for="img of imgData" :key="img" :src="img" alt="" width="1200px" height="600px">
</template>

<style>

</style>

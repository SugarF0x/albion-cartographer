<script lang="ts" setup>
import { screenCapture } from '#preload'
import { onMounted, ref } from 'vue'

const imgData = ref<string[]>([])
onMounted(() => {
  screenCapture((data, position) => {
    console.log(position)
    imgData.value.push(data)
  })
})
</script>

<template>
  <h1>cock and balls</h1>
  <img v-for="img of imgData" :key="img" :src="img" alt="" width="200px" height="100px">
</template>

<style>

</style>

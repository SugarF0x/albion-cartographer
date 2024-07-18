<script setup lang="ts">
import getSampleData from '/@/data/sampleData'
import { ref } from 'vue'
import Navigator from '/@/services/Navigator'
import Events from '/@/services/Events'
import AudioPlayer from '/@/services/AudioPlayer'

const importValue = ref('')

function exportData() {
  importValue.value = Navigator.links.export()
  Events.push('Pushed current state for export', 'alert')
}

function importData() {
  Navigator.links.import(importValue.value)
}

function flush() {
  const shouldDelete = confirm('Are you sure you want to delete all your local links data?')
  if (!shouldDelete) return
  Navigator.links.flush()
  Events.push('Cleared links data')
}

const isDev = location.protocol === 'http:'
</script>

<template>
  audio volume
  <input v-model.number="AudioPlayer.volume.value" type="range" :min="AudioPlayer.MIN_VOLUME" :max="AudioPlayer.MAX_VOLUME" :step="(AudioPlayer.MAX_VOLUME - AudioPlayer.MIN_VOLUME) / 100" />

  <div style="flex-grow: 1" />

  <textarea v-model="importValue" rows="10" />
  <button :disabled="!importValue" @click="importData">import</button>
  <button @click="exportData">export</button>
  <button v-if="isDev" @click="importValue = getSampleData()">paste sample</button>
  <button @click="flush">clear storage</button>
</template>

<style scoped lang="scss">

</style>
<script setup lang="ts">
import getSampleData from '/@/data/sampleData'
import { ref } from 'vue'
import Navigator from '/@/services/Navigator'
import Events from '/@/services/Events'
import AudioPlayer from '/@/services/AudioPlayer'

const importValue = ref('')

function exportData() {
  importValue.value = Navigator.export()
  Events.push('Pushed current state for export', 'alert')
}

function importData() {
  Navigator.import(importValue.value)
}
</script>

<template>
  audio volume
  <input v-model.number="AudioPlayer.volume.value" type="range" :min="AudioPlayer.MIN_VOLUME" :max="AudioPlayer.MAX_VOLUME" :step="(AudioPlayer.MAX_VOLUME - AudioPlayer.MIN_VOLUME) / 100" />

  <div style="flex-grow: 1" />

  <textarea v-model="importValue" rows="10" />
  <button :disabled="!importValue" @click="importData">import</button>
  <button @click="exportData">export</button>
  <button @click="importValue = getSampleData()">paste sample</button>
</template>

<style scoped lang="scss">

</style>
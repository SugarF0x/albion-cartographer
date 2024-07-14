<script setup lang="ts">
import { ref, watch } from 'vue'
import { Zone, Road } from '/@/data/zone'

const model = defineModel<string | undefined>()
const input = ref(model.value ?? '')

watch(model, value => { input.value = value ?? '' })

const hasError = ref(false)

const allZones = new Set<string>([...Object.values(Zone), ...Object.values(Road)])
function apply() {
  if (allZones.has(input.value)) {
    model.value = input.value
    hasError.value = false
    return
  }

  hasError.value = true
  model.value = undefined
}
</script>

<template>
  <input v-model="input" type="text" :class="{ error: hasError }" @keydown.enter="apply" />
</template>

<style scoped lang="scss">
.error {
  border: 1px solid red;
  background-color: #ffa2a2;
}
</style>

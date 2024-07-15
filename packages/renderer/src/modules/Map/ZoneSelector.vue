<script setup lang="ts">
import { ref, watch } from 'vue'
import { Zone, Road } from '/@/data/zone'
import Navigator from '/@/services/Navigator'

const props = defineProps<{
  position: 'from' | 'to'
}>()

const input = ref('')
const hasError = ref(false)

const allZones = new Set<string>([...Object.values(Zone), ...Object.values(Road)])
watch(input, value => {
  if (value && !allZones.has(value)) return void (hasError.value = true)

  hasError.value = false
  Navigator.pathfinder[props.position] = value
})

watch(() => Navigator.pathfinder.to, value => void (props.position === 'to' && (input.value = value)))
watch(() => Navigator.pathfinder.from, value => void (props.position === 'from' && (input.value = value)))
</script>

<template>
  <input v-model.trim="input" type="text" :class="{ error: hasError }" />
</template>

<style scoped lang="scss">
.error {
  border: 2px solid red;
  background-color: #ffa2a2;
}
</style>

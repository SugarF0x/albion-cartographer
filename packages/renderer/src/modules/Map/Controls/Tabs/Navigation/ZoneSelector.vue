<script setup lang="ts">
import { ref, watch } from 'vue'
import Navigator from '/@/services/Navigator'
import { getLocaleId, getZoneLocale } from '/@/data/locales'

const props = defineProps<{
  position: 'from' | 'to'
}>()

const input = ref(Navigator.pathfinder.link[props.position])
const hasError = ref(false)

watch(input, value => {
  const id = getLocaleId(value ?? '')
  if (value && !id) return void (hasError.value = true)

  hasError.value = false
  Navigator.pathfinder.link[props.position] = id ?? ''
  Navigator.inspector.node.value = id ?? null
})

watch(() => Navigator.pathfinder.link[props.position], value => { input.value = getZoneLocale(value) })
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

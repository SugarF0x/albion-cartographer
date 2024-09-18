<script setup lang="ts">
import { formatDistanceToNow, isBefore } from 'date-fns'
import { computed, ref, watch } from 'vue'
import Navigator from '/@/services/Navigator'
import { getZoneLocale } from '/@/data/locales'
import html2canvas from 'html2canvas'
import { copyImage, copyText } from '#preload'

const isExitRouteInverted = ref(false)
const exitRouteIndex = ref(0)
watch(Navigator.pathfinder.exitRoutes, () => { exitRouteIndex.value = 0 })

const isExitRoutesMode = computed(() => Navigator.pathfinder.exitRoutes.value.length)

const route = computed(() => {
  if (!isExitRoutesMode.value) return Navigator.pathfinder.route.value

  if (isExitRouteInverted.value) {
    const reversedRoute = Navigator.pathfinder.exitRoutes.value[exitRouteIndex.value].toReversed()
    return reversedRoute.map(link => ({ ...link, source: link.target, target: link.source }))
  }

  return Navigator.pathfinder.exitRoutes.value[exitRouteIndex.value]
})

watch(route, value => {
  if (!isExitRoutesMode.value) return
  Navigator.pathfinder.route.value = value
})

const tableRef = ref<HTMLTableElement | null>(null)
const isCopying = ref(false)
function copyAsImage() {
  if (!tableRef.value) return
  isCopying.value = true

  const width = tableRef.value.offsetWidth
  const scale = 512 / width

  /**
   * @Reason the disabled state on the element does not have enough time to update
   * and when the copying takes place, the app freezes leaving the button in enabled state visually
   * This ensures that the button disabled first and then the copying commences.
   * Awaiting next tick does not work
   */
  setTimeout(() => {
    if (!tableRef.value) return
    html2canvas(tableRef.value, { backgroundColor: '#323B44', scale }).then(canvas => {
      copyImage(canvas.toDataURL('image/png'))
      isCopying.value = false
    })
  }, 10)
}

function getFormattedExpirationStamp() {
  if (!route.value.length) return null

  const minExpiration = route.value.reduce((acc, val) => {
    if (!acc) return val.expiration
    if (isBefore(val.expiration, acc)) return val.expiration
    return acc
  }, '')

  const timestamp = Math.floor(new Date(minExpiration).getTime() / 1000)
  return `Закрывается <t:${timestamp}:R>`
}

function copyExpirationStamp() {
  const stamp = getFormattedExpirationStamp()
  if (!stamp) return

  copyText(stamp)
}

function copyAsList() {
  const stamp = getFormattedExpirationStamp()
  if (!stamp) return

  copyText([
    stamp,
    '* ' + getZoneLocale(route.value[0].source),
    ...route.value.map(link => '* ' + getZoneLocale(link.target)),
  ].join('\n'))
}
</script>

<template>
  <div v-if="!route.length">No path found</div>
  <template v-else>
    <div v-if="isExitRoutesMode" class="exits-list-controls">
      <button :disabled="exitRouteIndex - 1 < 0" @click="exitRouteIndex--">&triangleleft;</button>
      <span>{{ exitRouteIndex + 1 }}</span>
      <button :disabled="exitRouteIndex + 1 >= Navigator.pathfinder.exitRoutes.value.length" @click="exitRouteIndex++">&triangleright;</button>
      <button @click="isExitRouteInverted = !isExitRouteInverted">invert</button>
    </div>
    <table ref="tableRef" class="path-table">
      <thead>
        <tr>
          <th>from</th>
          <th>to</th>
          <th>expires in</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="link of route" :key="link.source">
          <td>{{ getZoneLocale(link.source) }}</td>
          <td>{{ getZoneLocale(link.target) }}</td>
          <td>
            <template v-if="link.expiration !== 'never'">{{ formatDistanceToNow(new Date(link.expiration)) }}</template>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="actions">
      copy as
      <button class="copy" :disabled="isCopying" @click="copyExpirationStamp">stamp</button>
      <button class="copy" :disabled="isCopying" @click="copyAsImage">image</button>
      <button class="copy" :disabled="isCopying" @click="copyAsList">list</button>
    </div>
  </template>
</template>

<style scoped lang="scss">
.path-table {
  border-collapse: collapse;
  border: 1px solid;
  font-size: min(1vw, 20px);

  td, th {
    border: 1px solid;
    padding: 4px;
  }
}

.exits-list-controls {
  display: flex;
  gap: 4px;
}

button.copy {
  &:disabled {
    background-color: grey;
  }
}

.actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
  justify-content: flex-end;
}
</style>
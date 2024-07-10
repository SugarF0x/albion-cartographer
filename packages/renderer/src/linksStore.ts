import { useLocalStorage } from '@vueuse/core'
import { onMounted } from 'vue'
import { isBefore } from 'date-fns'

export interface CustomLinkData {
  source: string
  target: string
  expiration: string
}

export function useCustomLinks() {
  const data = useLocalStorage<CustomLinkData[]>('customLinks', [])

  onMounted(() => {
    function removeExpired() {
      data.value = data.value.filter(({ expiration }) => isBefore(new Date(), expiration))
    }

    function scheduleRemoval() {
      const minExpiration = data.value.reduce((acc, val) => {
        return Math.min(acc, new Date(val.expiration).valueOf())
      }, Infinity)

      if (minExpiration < Infinity) setTimeout(() => {
        removeExpired()
        scheduleRemoval()
      }, minExpiration - Date.now())
    }

    removeExpired()
    scheduleRemoval()
  })

  return data
}

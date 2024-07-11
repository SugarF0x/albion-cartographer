import { useLocalStorage } from '@vueuse/core'
import { isBefore, add, millisecondsToSeconds } from 'date-fns'
import { computed } from 'vue'
import { cloneDeep } from 'lodash'
import { ZoneToLinksMap } from '/@/data/staticZones'
import type { Datum } from '/@/pathing'
import { play } from '/@/audioPlayer'

export interface CustomLinkData {
  source: string
  target: string
  expiration: string
}

export const storeLinks = useLocalStorage<CustomLinkData[]>('customLinks', [])
export const zoneToStoreLinksMap = computed(() => {
  return storeLinks.value.reduce<Record<string, string[]>>((acc, val) => {
    if (isBefore(new Date(val.expiration), new Date())) return acc
    acc[val.source] ??= []
    if (!(val.target in acc[val.source])) acc[val.source].push(val.target)
    return acc
  }, {})
})

const inputLinks = Object.entries(ZoneToLinksMap).reduce<Datum[]>((acc, [zone, links]) => {
  for (const link of links) acc.push({ source: zone, target: link })
  return acc
}, [])

export const activeLinks = computed(() => {
  const results = cloneDeep(inputLinks)
  for (const { source, target } of storeLinks.value) results.push({ source, target })
  return results
})

export const activeLinksMap = computed(() => {
  return activeLinks.value.reduce<Record<string, string[]>>((acc, val) => {
    acc[val.source as string] ??= []
    acc[val.source as string].push(val.target as string)
    return acc
  }, {})
})

function removeExpired() {
  storeLinks.value = storeLinks.value.filter(({ expiration }) => isBefore(new Date(), new Date(expiration)))
}

function scheduleRemoval() {
  const minExpiration = storeLinks.value.reduce((acc, val) => {
    return Math.min(acc, new Date(val.expiration).valueOf())
  }, Infinity)

  if (minExpiration < Infinity) setTimeout(() => {
    removeExpired()
    scheduleRemoval()
  }, minExpiration - Date.now())
}

removeExpired()
scheduleRemoval()

export function addLink(source: string, target: string, time: number) {
  const expiration = add(new Date(), { seconds: millisecondsToSeconds(time) }).toISOString()
  if (isBefore(expiration, new Date())) return play('error')

  const links = zoneToStoreLinksMap.value[source]
  console.log(source, target, links, zoneToStoreLinksMap.value)
  if (!(!links || !(links.includes(target)))) return play('notification')

  play('open')
  storeLinks.value.push({ source, target, expiration }, { source: target, target: source, expiration })
}

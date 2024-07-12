import { useLocalStorage } from '@vueuse/core'
import { isBefore, add, millisecondsToSeconds } from 'date-fns'
import { computed } from 'vue'
import { cloneDeep } from 'lodash'
import { ZoneToLinksMap } from '/@/data/staticZones'
import type { Datum } from '/@/pathing'
import Events from '/@/Events'
import { z } from 'zod'
import type AudioPlayer from '/@/AudioPlayer'

export const CustomLinkDataSchema = z.object({
  source: z.string(),
  target: z.string(),
  expiration: z.string().datetime(),
})

export type CustomLinkData = z.infer<typeof CustomLinkDataSchema>

export const storeLinks = useLocalStorage<CustomLinkData[]>('customLinks', [])

const inputLinks = Object.entries(ZoneToLinksMap).reduce<Datum[]>((acc, [zone, links]) => {
  for (const link of links) acc.push({ source: zone, target: link })
  return acc
}, [])

export const activeLinks = computed(() => {
  const results = cloneDeep(inputLinks)
  for (const { source, target, expiration } of storeLinks.value) {
    if (isBefore(new Date(expiration), new Date())) continue
    results.push({ source, target }, { source: target, target: source })
  }
  return results
})

export const activeLinksMap = computed(() => {
  return activeLinks.value.reduce<Record<string, string[]>>((acc, val) => {
    acc[val.source as string] ??= []
    acc[val.source as string].push(val.target as string)
    return acc
  }, {})
})

export const zoneToStoreLinksMap = computed(() => {
  return activeLinks.value.reduce<Record<string, string[]>>((acc, val) => {
    const source = val.source as string
    const target = val.target as string
    acc[source] ??= []
    if (!(target in acc[source])) acc[source].push(target)
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

export function addLink(source: string, target: string, time: number, silent?: boolean) {
  function getSound(type: Parameters<typeof AudioPlayer.play>[0]) {
    if (silent) return undefined
    return type
  }

  const expiration = add(new Date(), { seconds: millisecondsToSeconds(time) }).toISOString()
  if (isBefore(expiration, new Date())) return void Events.push(new Error(`Link is expired: ${source} > ${target}`), getSound('error'))

  const links = zoneToStoreLinksMap.value[source]
  if (!(!links || !(links.includes(target)))) return void Events.push(`Duplicate link found: ${source} > ${target}`, getSound('notification'))

  Events.push(`Added new link: ${source} > ${target}`, getSound('open'))
  storeLinks.value.push({ source, target, expiration })
}

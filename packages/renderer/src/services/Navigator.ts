import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { z } from 'zod'
import { useLocalStorage } from '@vueuse/core'
import { ZoneToLinksMap } from '/@/data/staticZones'
import { cloneDeep } from 'lodash'
import { formatDistanceToNow, isBefore } from 'date-fns'
import Events from '/@/services/Events'
import type AudioPlayer from '/@/services/AudioPlayer'
import { Zone } from '/@/data/zone'

export type LinkData = z.infer<typeof LinkSchema>
const LinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  expiration: z.string().datetime(),
})

function isLinkExpired(item: LinkData): boolean {
  return isBefore(new Date(item.expiration), new Date())
}

function isLinkNotExpired(item: LinkData): boolean {
  return !isLinkExpired(item)
}

const storeLinks = useLocalStorage<LinkData[]>('customLinks', [])

let cleanupTimeout: NodeJS.Timeout | null = null
function scheduleRemoval() {
  if (cleanupTimeout) clearInterval(cleanupTimeout)
  if (!storeLinks.value.length) return

  const closestExpiration = Math.max(storeLinks.value.reduce((acc, val) => Math.min(acc, new Date(val.expiration).valueOf() - Date.now()), Infinity), 0)
  if (closestExpiration < Infinity) cleanupTimeout = setTimeout(() => {
    removeExpired()
    scheduleRemoval()
  }, closestExpiration)
}

function removeExpired() {
  storeLinks.value = storeLinks.value.filter(isLinkNotExpired)
}

const staticLinks = Object.entries(ZoneToLinksMap).reduce<LinkData[]>((acc, [zone, links]) => {
  for (const link of links) acc.push({ source: zone, target: link, expiration: 'never' })
  return acc
}, [])

const links = computed(() => {
  const results = cloneDeep(staticLinks)
  for (const item of storeLinks.value) {
    if (isLinkExpired(item)) continue

    const { source, target, expiration } = item
    results.push({ source, target, expiration }, { source: target, target: source, expiration })
  }
  return results
})

const zoneToLinksMap = computed(() => {
  return links.value.reduce<Record<string, string[]>>((acc, val) => {
    acc[val.source as string] ??= []
    acc[val.source as string].push(val.target as string)
    return acc
  }, {})
})

let isPushSilent = false
function getPushSound(type: Parameters<typeof AudioPlayer.play>[0]) {
  if (isPushSilent) return undefined
  return type
}

const lastInspectedNode = ref<null | string>(null)

function push(data: LinkData) {
  const { target, source } = data
  lastInspectedNode.value = target
  if (isLinkExpired(data)) return void Events.push(new Error(`Link is expired: ${source} > ${target}`), getPushSound('error'))

  const links = zoneToLinksMap.value[source]
  if (!(!links || !(links.includes(target)))) return void Events.push(`Duplicate link found: ${source} > ${target}`, getPushSound('notification'))

  Events.push(`Added new link: ${source} > ${target}`, getPushSound('open'))
  storeLinks.value.push(data)
}

function importRaw(raw: string) {
  try {
    const decoded = atob(raw)
    const data = JSON.parse(decoded)

    const validatedData = z.array(LinkSchema).parse(data)
    if (!validatedData.length) return Events.push('Failed to import: data is empty', 'notification')

    const filteredData = validatedData.filter(isLinkNotExpired)
    if (!filteredData.length) return Events.push('Failed to import: data is expired', 'notification')

    isPushSilent = true
    for (const item of filteredData) push(item)
    isPushSilent = false

    Events.push('Successfully imported data', 'open')
  } catch(e) {
    Events.push(String(e) + ' when importing value', 'error')
  }
}

function exportRaw(): string {
  return btoa(JSON.stringify(storeLinks.value))
}

function flush() {
  storeLinks.value = []
}

const pathfinder = reactive({ from: '', to: '' })
const pathfinderRoute = ref<LinkData[]>([])

watchEffect(() => { findShortestPath(pathfinder.from, pathfinder.to) })

const pathExpiration = computed(() => {
  const minExpiration = pathfinderRoute.value.reduce((acc, val) => Math.min(acc, new Date(val.expiration).valueOf() || Infinity), Infinity)
  if (minExpiration < Infinity) return formatDistanceToNow(new Date(minExpiration))
  return 'never'
})

export function findShortestPath(startNode: string, endNode: string) {
  if (!startNode || !endNode) return false

  if (startNode === endNode) {
    pathfinderRoute.value = []
    return true
  }

  const queue: string[][] = [[startNode]]
  const visited: Set<string> = new Set([startNode])

  while (queue.length > 0) {
    const path = queue.shift()
    if (!path) continue

    const node = path[path.length - 1]
    const neighbors = zoneToLinksMap.value[node] || []

    for (const neighbor of neighbors) {
      if (neighbor === endNode) {
        const fullPath = [...path, neighbor]
        const result: LinkData[] = []

        for (let i = 0; i < fullPath.length - 1; i++) {
          const source = fullPath[i]
          const target = fullPath[i + 1]

          const expiration = (() => {
            if (source in Zone && target in Zone) return 'never'
            const linkData = storeLinks.value.find(link => (link.target === target && link.source === source) || (link.target === source && link.source === target))
            return linkData?.expiration ?? 'never'
          })()
          result.push({ source, target, expiration })
        }

        pathfinderRoute.value = result
        return true
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push([...path, neighbor])
      }
    }
  }

  pathfinderRoute.value = []
  return false
}

removeExpired()
scheduleRemoval()
watch(storeLinks, scheduleRemoval, { deep: true })

export default {
  links,
  pathfinder,
  pathfinderRoute,
  pathExpiration,
  zoneToLinksMap,
  push,
  import: importRaw,
  export: exportRaw,
  flush,
  findShortestPath,
  LinkSchema,
  lastInspectedNode,
}

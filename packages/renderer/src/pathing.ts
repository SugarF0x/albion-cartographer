import type * as d3 from 'd3'
import { ref } from 'vue'
import Navigator from '/@/Navigator'

export type Datum = d3.SimulationLinkDatum<Record<string, unknown>>

export const pathfinderRoute = ref<Datum[]>([])

export function findShortestPath(startNode: string, endNode: string) {
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
    const neighbors = Navigator.zoneToLinksMap.value[node] || []

    for (const neighbor of neighbors) {
      if (neighbor === endNode) {
        const fullPath = [...path, neighbor]
        const result: Datum[] = []

        for (let i = 0; i < fullPath.length - 1; i++)
          result.push({ source: fullPath[i], target: fullPath[i + 1] })

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

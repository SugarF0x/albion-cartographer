import type { Zone } from '/@/data/zone'
import { ZoneToLinksMap } from '/@/data/staticZones'
import type * as d3 from 'd3'

export type Datum = d3.SimulationLinkDatum<Record<string, unknown>>

export function findShortestPath(startNode: Zone, endNode: Zone): Datum[] | null {
  if (startNode === endNode) return []

  const queue: Zone[][] = [[startNode]]
  const visited: Set<Zone> = new Set([startNode])

  while (queue.length > 0) {
    const path = queue.shift()
    if (!path) continue

    const node = path[path.length - 1]
    const neighbors = ZoneToLinksMap[node] || []

    for (const neighbor of neighbors) {
      if (neighbor === endNode) {
        const fullPath = [...path, neighbor]
        const result: Datum[] = []

        for (let i = 0; i < fullPath.length - 1; i++)
          result.push({ source: fullPath[i], target: fullPath[i + 1] })

        return result
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push([...path, neighbor])
      }
    }
  }

  return null
}

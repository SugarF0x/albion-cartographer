<script setup lang="ts">
import { Road, Zone } from '/@/data/zone'
import { ZoneToNodeMap, ZoneToNodePosMap } from '/@/data/staticZones'
import Navigator from '/@/Navigator'
import * as d3 from 'd3'
import { cloneDeep, isEqual } from 'lodash'
import { type Datum, pathfinderRoute } from '/@/pathing'
import { ref, watch } from 'vue'

// TODO: fix types

const zones = Object.values(Zone).map(zone => ({ id: zone, fx: ZoneToNodePosMap[zone].x, fy: ZoneToNodePosMap[zone].y }))
const roads = Object.values(Road).map(zone => ({ id: zone }))
const inputNodes = [...zones, ...roads]
const inputLinks = cloneDeep(Navigator.links.value)

const size = 1048
const viewBox = `${-size/2} ${-size/2} ${size} ${size}`

function getZoneColor(area: Zone | Road) {
  if (!(area in Zone)) return 'white'
  const zone = area as Zone

  const colorMap = {
    STARTINGCITY: 'pink',
    CITY: 'green',
    SAFEAREA: 'blue',
    YELLOW: 'gold',
    RED: 'red',
    BLACK: 'black',
  }

  for (const [type, color] of Object.entries(colorMap))
    if (ZoneToNodeMap[zone].type.includes(type)) return color

  return 'magenta'
}

function getNodeOpacity(id: string) {
  if (id in Navigator.zoneToLinksMap.value) return 1
  return .25
}

function getLineStrokeColor(link: Datum) {
  const normalizedLink = { source: link.source.id, target: link.target.id }
  if (pathfinderRoute.value.some(datum => isEqual(datum, normalizedLink))) return 'red'
  return '#999'
}

function getStrokeWidth(link: Datum) {
  const normalizedLink = { source: link.source.id, target: link.target.id }
  if (pathfinderRoute.value.some(datum => isEqual(datum, normalizedLink))) return 5
  return 1
}

function getLinkStrength({ source, target }: Datum): number {
  const { id: sourceId } = source
  const { id: targetId } = target
  if (!targetId || !sourceId) return .5

  if ([
    targetId === `${sourceId}_PORTAL`,
    sourceId === `${targetId}_PORTAL`,
    targetId in Zone && sourceId in Road,
    sourceId in Zone && targetId in Road,
  ].some(Boolean)) return 0

  if (targetId in Road && sourceId in Road) return .05

  return 2.1
}

const simulation = d3.forceSimulation(inputNodes)
  .force('link', d3.forceLink(inputLinks)
    .id(d => d.id)
    .distance(10)
    .strength(getLinkStrength),
  )
  .force('charge', d3.forceManyBody())
  .force('x', d3.forceX())
  .force('y', d3.forceY())

const tick = ref(0)
simulation.on('tick', () => { tick.value++ })

watch(Navigator.links, value => {
  inputLinks.length = 0
  Object.assign(inputLinks, cloneDeep(value))

  simulation
    .nodes(inputNodes)
    .force('link', d3.forceLink(inputLinks)
      .id(d => d.id)
      .distance(10)
      .strength(getLinkStrength),
    )
    .alpha(.5).restart()
})
</script>

<template>
  <svg id="map" :key="tick" :viewBox="viewBox">
    <g stroke-opacity="0.6">
      <line
        v-for="link of inputLinks"
        :key="`${link.source}-${link.target}`"
        :stroke="getLineStrokeColor(link)"
        :stroke-width="getStrokeWidth(link)"
        :x1="link.source.x"
        :y1="link.source.y"
        :x2="link.target.x"
        :y2="link.target.y"
      />
    </g>
    <g stroke="#fff" stroke-width="1.5">
      <circle
        v-for="node of inputNodes"
        :key="node.id" r="5"
        :fill="getZoneColor(node.id)"
        :opacity="getNodeOpacity(node.id)"
        :cx="node.x"
        :cy="node.y"
      >
        <title>{{ node.id }}</title>
      </circle>
    </g>
  </svg>
</template>

<style scoped lang="scss">
</style>

<script setup lang="ts">
import * as d3 from 'd3'
import { cloneDeep, isEqual, clamp } from 'lodash'
import { reactive, ref, watch } from 'vue'
import { Road, Zone } from '/@/data/zone'
import { ZoneToNodeMap, ZoneToNodePosMap } from '/@/data/staticZones'
import Navigator from '/@/services/Navigator'

defineEmits<{
  (e: 'from', payload: string): void
  (e: 'to', payload: string): void
}>()

// TODO: consider using Konva instead of svgs

type NodeDatum =  d3.SimulationNodeDatum & { id: string }
type LinkDatum = { index?: number, source: NodeDatum, target: NodeDatum }

const zones: NodeDatum[] = Object.values(Zone).map(zone => ({ id: zone, fx: ZoneToNodePosMap[zone].x, fy: ZoneToNodePosMap[zone].y }))
const roads: NodeDatum[] = Object.values(Road).map(zone => ({ id: zone }))
const inputNodes = [...zones, ...roads]
const inputLinks = cloneDeep(Navigator.links.value) as unknown as LinkDatum[]

const size = 1024 * 1.15
const viewBox = `${-size / 2} ${-size / 2} ${size} ${size}`

const zoom = ref(1)
const offset = reactive({ x: 0, y: 0 })

function onScroll(event: WheelEvent) {
  const step = 0.05
  const change = clamp(event.deltaY, -1, 1) * step
  zoom.value = Math.max(0.05, zoom.value - change)
}

let isDragging = false
function dragStart() { isDragging = true }
function dragStop() { isDragging = false }

function onPointerMove(event: PointerEvent) {
  if (!isDragging) return
  const { movementX, movementY } = event
  offset.x += movementX / zoom.value
  offset.y += movementY / zoom.value
}

function getZoneColor(area: string) {
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

function getIsLinkInPath(link: LinkDatum) {
  const normalizedLink = { source: link.source.id, target: link.target.id }
  return Navigator.pathfinderRoute.value.some(({ source, target }) => isEqual({ source, target }, normalizedLink))
}

function getLineStrokeColor(link: LinkDatum) {
  if (getIsLinkInPath(link)) return 'red'
  return '#999'
}

function getStrokeWidth(link: LinkDatum) {
  if (getIsLinkInPath(link)) return 5
  return 1
}

function getLineOpacity(link: LinkDatum) {
  if ((link.source.id in Zone && link.target.id in Zone) || (link.source.id in Road && link.target.id in Road)) return 1
  if (getIsLinkInPath(link)) return 1
  return .1
}

function getLinkStrength(link: LinkDatum): number {
  if ([
    link.target.id in Zone && link.source.id in Road,
    link.source.id in Zone && link.target.id in Road,
  ].some(Boolean)) return 0

  if (link.target.id in Road && link.source.id in Road) return .5

  return 1
}

function getNodeStrength(node: NodeDatum) {
  if (node.id in Road || node.id in Zone) return -40
  return 0
}

const simulation = d3.forceSimulation(inputNodes)
  .force('link', d3.forceLink<NodeDatum, LinkDatum>(inputLinks).id(d => d.id).strength(getLinkStrength))
  .force('charge', d3.forceManyBody<NodeDatum>().strength(getNodeStrength))
  .force('x', d3.forceX())
  .force('y', d3.forceY())

const tick = ref(0)
simulation.on('tick', () => { tick.value++ })

watch(Navigator.links, value => {
  inputLinks.length = 0
  Object.assign(inputLinks, cloneDeep(value))

  simulation
    .nodes(inputNodes)
    .force('link', d3.forceLink<NodeDatum, LinkDatum>(inputLinks).id(d => d.id).strength(getLinkStrength))
    .alpha(.5).restart()
})

const IMAGE_SIZE = [512, 1024].map(e => e * 1.55)
</script>

<template>
  <svg
    id="map"
    :key="tick"
    :viewBox="viewBox"
    @wheel="onScroll"
    @pointermove="onPointerMove"
    @pointerdown="dragStart"
    @pointerup="dragStop"
    @pointerleave="dragStop"
  >
    <g :style="{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)` }">
      <image
        href="/images/albion.png"
        :width="IMAGE_SIZE[0]"
        :height="IMAGE_SIZE[1]"
        :x="-IMAGE_SIZE[0] / 2"
        :y="-IMAGE_SIZE[1] / 2"
      />
      <g stroke-opacity="0.6">
        <line
          v-for="link of inputLinks"
          :key="`${link.source}-${link.target}`"
          :stroke="getLineStrokeColor(link)"
          :stroke-width="getStrokeWidth(link)"
          :opacity="getLineOpacity(link)"
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
          @click.left="$emit('from', node.id)"
          @click.right="$emit('to', node.id)"
        >
          <title>{{ node.id }}</title>
        </circle>
      </g>
    </g>
  </svg>
</template>

<style scoped lang="scss">
#map {
  overflow: hidden;
}
</style>

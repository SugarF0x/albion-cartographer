<script setup lang="ts">
import * as d3 from 'd3'
import { cloneDeep, isEqual, clamp, pick } from 'lodash'
import { computed, reactive, ref, watch } from 'vue'
import { Road, Zone } from '/@/data/zone'
import { ZoneToNodeMap, ZoneToNodePosMap } from '/@/data/staticZones'
import Navigator from '/@/services/Navigator'

defineEmits<{
  (e: 'click', node: string, event: MouseEvent): void
}>()

const mappedPercentage = computed(() => {
  const mappedRoads = Navigator.links.value.reduce((acc, val) => {
    if (val.source in Road) acc.add(val.source)
    if (val.target in Road) acc.add(val.target)
    return acc
  }, new Set<string>())

  return Math.floor((mappedRoads.size / Object.values(Road).length) * 1000) / 10 + '%'
})

type NodeDatum =  d3.SimulationNodeDatum & { id: string }
type LinkDatum = { index?: number, source: NodeDatum, target: NodeDatum }

const zones: NodeDatum[] = Object.values(Zone).map(zone => ({ id: zone, fx: ZoneToNodePosMap[zone].x, fy: ZoneToNodePosMap[zone].y }))
const roads: NodeDatum[] = Object.values(Road).map(zone => ({ id: zone }))
const inputNodes = [...zones, ...roads]
const inputLinks = cloneDeep(Navigator.links.value) as unknown as LinkDatum[]

const IMAGE_SIZE = [512, 1024].map(e => e * 1.55)
const size = 1024 * 1.15
const viewBox = `${-size / 2} ${-size / 2} ${size} ${size}`

const zoom = ref(1)
const offset = reactive({ x: 0, y: 0 })

function onScroll(event: WheelEvent) {
  const step = zoom.value * .1
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

function getNodeAttributes(node: NodeDatum) {
  const { id, x, y } = node

  const fill = (() => {
    if (!(id in Zone)) return 'white'
    const zone = id as Zone

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
  })()

  const opacity = (() => {
    if (id in Navigator.zoneToLinksMap.value || Navigator.lastInspectedNode.value === id) return 1
    return .25
  })()

  const rest = (() => {
    if (Navigator.lastInspectedNode.value === id) return {
      'stroke': '#ff00f6',
      'stroke-dasharray': 4,
      'stroke-width': 10,
      'class': 'last-inspected-node',
    }

    return {
      'stroke': '#fff',
      'stroke-width': 1.5,
    }
  })()

  const position = {
    cx: x,
    cy: y,
  }

  return { fill, opacity, ...position, ...rest }
}

function getLineAttributes(link: LinkDatum) {
  const { isLinkInPath, isLastAddedPath } = (() => {
    const normalizedLink = { source: link.source.id, target: link.target.id }
    const isLinkInPath = Navigator.pathfinderRoute.value.some(routeLink => isEqual(pick(routeLink, ['source', 'target']), normalizedLink))
    const isLastAddedPath = isEqual(pick(Navigator.lastInspectedLink.value, ['source', 'target']), normalizedLink)
    return { isLinkInPath, isLastAddedPath }
  })()

  const opacity = (() => {
    const isSameZoneType = (link.source.id in Zone && link.target.id in Zone) || (link.source.id in Road && link.target.id in Road)
    if (isSameZoneType || isLinkInPath || isLastAddedPath) return 1
    return .1
  })()

  const rest = (() => {
    if (isLastAddedPath) return {
      'stroke': '#ff00f6',
      'stroke-width': 5,
    }

    if (isLinkInPath) return {
      'stroke': '#f00',
      'stroke-width': 5,
    }

    return {
      'stroke': '#999',
      'stroke-width': 1,
    }
  })()

  return { opacity, ...rest }
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

const nodesGroup = ref<SVGElement | null>(null)
const linksGroup = ref<SVGElement | null>(null)
simulation.on('tick', () => {
  if (!nodesGroup.value) return
  if (!linksGroup.value) return

  Array.from(nodesGroup.value.children).forEach((node, index) => {
    node.setAttribute('cx', String(inputNodes[index].x ?? 0))
    node.setAttribute('cy', String(inputNodes[index].y ?? 0))
  })

  Array.from(linksGroup.value.children).forEach((link, index) => {
    link.setAttribute('x1', String(inputLinks[index].source.x ?? 0))
    link.setAttribute('y1', String(inputLinks[index].source.y ?? 0))
    link.setAttribute('x2', String(inputLinks[index].target.x ?? 0))
    link.setAttribute('y2', String(inputLinks[index].target.y ?? 0))
  })
})

watch(Navigator.links, value => {
  inputLinks.length = 0
  Object.assign(inputLinks, cloneDeep(value))

  simulation
    .nodes(inputNodes)
    .force('link', d3.forceLink<NodeDatum, LinkDatum>(inputLinks).id(d => d.id).strength(getLinkStrength))
    .alpha(.5).restart()
})
</script>

<template>
  <div id="mapped-percentage">Mapped: {{ mappedPercentage }}</div>
  <svg
    id="map"
    :viewBox="viewBox"
    @wheel="onScroll"
    @pointermove="onPointerMove"
    @pointerdown="dragStart"
    @pointerup="dragStop"
    @pointerleave="dragStop"
  >
    <g :style="{ transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)` }">
      <image href="/images/albion.png" :width="IMAGE_SIZE[0]" :height="IMAGE_SIZE[1]" :x="-IMAGE_SIZE[0] / 2" :y="-IMAGE_SIZE[1] / 2" />
      <g ref="linksGroup">
        <line v-for="link of inputLinks" v-bind="getLineAttributes(link)" :key="`${link.source}-${link.target}`" />
      </g>
      <g ref="nodesGroup">
        <circle v-for="node of inputNodes" v-bind="getNodeAttributes(node)" :key="node.id" r="5" @click.right="(event) => $emit('click', node.id, event)">
          <title>{{ node.id }}</title>
        </circle>
      </g>
    </g>
  </svg>
</template>

<style scoped lang="scss">
#map {
  overflow: hidden;
  display: flex;
  justify-content: center;
  max-height: 100vh;
  z-index: 1;
  flex-grow: 1;
}

.last-inspected-node {
  stroke-dashoffset: 0;
  animation: dash .25s linear infinite;
}

@keyframes dash {
  to {
    stroke-dashoffset: 8;
  }
}

#mapped-percentage {
  position: absolute;
  top: 16px;
  left: 16px;
  user-select: none;
  pointer-events: none;
  z-index: 0;
}
</style>

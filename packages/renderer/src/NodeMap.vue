<script lang="ts" setup>
import * as d3 from 'd3'
import { ZoneToLinksMap, ZoneToNodeMap } from '/@/data/staticZones'
import { Road, Zone } from '/@/data/zone'
import { cloneDeep } from 'lodash'
import { type Datum } from '/@/pathing'
import { onBeforeUnmount, onMounted } from 'vue'
import { screenCapture } from '#preload'

function linkToString(value: Datum) {
  if (typeof value.source !== 'object' || typeof value.target !== 'object') return `${value.source}/${value.target}`
  if ('id' in value.source && 'id' in value.target) return `${value.source.id}/${value.target.id}`
  return ''
}

// const PATH = findShortestPath(Zone.LYMHURST, Zone.MERLYNS_REST)
const PATH_STRINGS: string[] = []
// const PATH_STRINGS = PATH?.map(linkToString) ?? []
// const PATH_LOCATIONS: Zone[] = PATH?.reduce<Zone[]>((acc, val) => Array.from(new Set([...acc, val.source as Zone, val.target as Zone])), []) ?? []

const inputNodes = [...Object.values(Zone), ...Object.values(Road)].map(zone => ({ id: zone }))
const inputLinks = Object.entries(ZoneToLinksMap).reduce<Datum[]>((acc, [zone, links]) => {
  for (const link of links) acc.push({ source: zone, target: link })
  return acc
}, [])

type ProcessedNode = d3.SimulationNodeDatum & typeof inputNodes[number]

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

function getLinkStrength({ source, target }: Datum): number {
  const { id: sourceId } = source as unknown as ProcessedNode
  const { id: targetId } = target as unknown as ProcessedNode
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

function chart() {
  const width = 1048
  const height = 1048

  const { nodes, links } = cloneDeep({ nodes: inputNodes, links: inputLinks })

  const simulation = d3.forceSimulation(nodes as ProcessedNode[])
    .force('link', d3.forceLink(links)
      .id(d => (d as ProcessedNode).id)
      .distance(10)
      .strength(getLinkStrength),
    )
    .force('charge', d3.forceManyBody())
    .force('x', d3.forceX())
    .force('y', d3.forceY())

  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-width / 2, -height / 2, width, height])
    .attr('style', 'max-width: 100%; height: auto;')

  let link = svg.append('g')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', datum => PATH_STRINGS.includes(linkToString(datum)) ? 'red' : '#999')
    .attr('stroke-width', datum => PATH_STRINGS.includes(linkToString(datum)) ? 5 : 1) as d3.Selection<SVGLineElement, Datum, SVGElement, undefined>

  let node = svg.append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', 5)
    .attr('fill', d => getZoneColor(d.id))

  node.append('title').text(d => d.id)

  function ticked() {
    link
      .attr('x1', d => (d.source as unknown as ProcessedNode).x ?? 0)
      .attr('y1', d => (d.source as unknown as ProcessedNode).y ?? 0)
      .attr('x2', d => (d.target as unknown as ProcessedNode).x ?? 0)
      .attr('y2', d => (d.target as unknown as ProcessedNode).y ?? 0)

    node
      .attr('cx', d => (d as ProcessedNode).x ?? 0)
      .attr('cy', d => (d as ProcessedNode).y ?? 0)
  }

  simulation.on('tick', ticked)

  function update() {
    const newLinks = cloneDeep(inputLinks)
    link = link.data(newLinks)

    link.exit().remove()

    link = link.enter()
      .append('line')
      .attr('stroke', datum => PATH_STRINGS.includes(linkToString(datum)) ? 'red' : '#999')
      .attr('stroke-width', datum => PATH_STRINGS.includes(linkToString(datum)) ? 5 : 1)
      .merge(link)

    // Update and restart simulation with new links
    simulation
      .nodes(nodes as ProcessedNode[])
      .force('link', d3.forceLink(newLinks)
        .id(d => (d as ProcessedNode).id)
        .distance(10)
        .strength(getLinkStrength),
      )
      .alpha(.3).restart()
  }

  return [svg.node(), update] as const
}

onMounted(() => {
  const [element, update] = chart()
  if (!element) return

  element.removeAttribute('width')
  element.removeAttribute('height')
  document.querySelector('#chart')?.appendChild(element)

  const stack = [
    { source: Zone.LYMHURST, target: Road.COROS_ALIEAM }, { source: Road.COROS_ALIEAM, target: Zone.LYMHURST },
    { source: Road.COROS_ALIEAM, target: Road.CASES_UGUMLOS }, { source: Road.CASES_UGUMLOS, target: Road.COROS_ALIEAM },
    { source: Road.CASES_UGUMLOS, target: Road.COUES_EXAKROM }, { source: Road.COUES_EXAKROM, target: Road.CASES_UGUMLOS },
    { source: Road.COUES_EXAKROM, target: Road.CERES_IOOINUM }, { source: Road.CERES_IOOINUM, target: Road.COUES_EXAKROM },
    { source: Road.CERES_IOOINUM, target: Zone.PEN_GENT }, { source: Zone.PEN_GENT, target: Road.CERES_IOOINUM },
  ]

  const unsubscribe = screenCapture(async () => {
    inputLinks.push(stack.shift()!, stack.shift()!)
    update()
  })

  onBeforeUnmount(unsubscribe)
})
</script>

<template>
  <div class="container">
    <div id="chart" />
    <div class="controls-container">
      some controls here
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
}

.controls-container {
  margin: 24px;
  max-width: min(50%, 600px);
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  :deep(#controls) {
    flex-grow: 1;
  }
}
</style>

<style lang="scss">
#chart {
  display: flex;
  justify-content: center;
  flex-grow: 1;
  max-height: 100vh;
}
</style>

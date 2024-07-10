import type { Datum } from '/@/pathing'
import { Road, Zone } from '/@/data/zone'
import { ZoneToLinksMap, ZoneToNodeMap } from '/@/data/staticZones'
import * as d3 from 'd3'
import { cloneDeep } from 'lodash'
import { computed, type Ref, watch } from 'vue'
import { type CustomLinkData } from '/@/linksStore'

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

export function chart(storeLinks: Ref<CustomLinkData[]>) {
  const width = 1048
  const height = 1048

  const activeLinks = computed(() => {
    const results = cloneDeep(inputLinks)
    for (const { source, target } of storeLinks.value) results.push({ source, target })
    return results
  })

  const activeLinksMap = computed(() => {
    return activeLinks.value.reduce<Record<string, string[]>>((acc, val) => {
      acc[val.source as string] ??= []
      acc[val.source as string].push(val.target as string)
      return acc
    }, {})
  })

  const { nodes, links } = cloneDeep({ nodes: inputNodes, links: activeLinks.value })

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

  const node = svg.append('g')
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
      .attr('opacity', d => d.id in activeLinksMap.value ? 1 : .25)
  }

  simulation.on('tick', ticked)

  watch(activeLinks, value => {
    const newLinks = cloneDeep(value)
    link = link.data(newLinks)

    link.exit().remove()

    link = link.enter()
      .append('line')
      .attr('stroke', datum => PATH_STRINGS.includes(linkToString(datum)) ? 'red' : '#999')
      .attr('stroke-width', datum => PATH_STRINGS.includes(linkToString(datum)) ? 5 : 1)
      .merge(link)

    simulation
      .nodes(nodes as ProcessedNode[])
      .force('link', d3.forceLink(newLinks)
        .id(d => (d as ProcessedNode).id)
        .distance(10)
        .strength(getLinkStrength),
      )
      .alpha(.3).restart()
    },
  )

  return svg.node()
}

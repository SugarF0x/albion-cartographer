import { data } from './raw'
import { Zone } from './zone'

interface AO2DNode {
  x: number
  y: number
  exits: Array<{ _attr: AO2DExitAttrs }>
  _attr: AO2DNodeAttrs
}

interface AO2DNodeAttrs {
  categoryname: string
  displayname: string
  editoroffset: string
  enabled: string
  file: string
  id: string
  minimapBaseLevel: string
  minimapBoundsMax: string
  minimapBoundsMin: string
  minimapHeightRange: string
  origin: string
  rareresourcedistribution: string
  size: string
  speciallocation: string
  timeregion: string
  type: string
  worldmapposition: string
}

interface AO2DExitAttrs {
  id: string
  pos: string
  proximitytooltiptype: string
  restricted: string
  roadtype: string
  targetid: string
  targettype: string
  territory: string
}

const nodes = data.nodes as AO2DNode[]

export const toSnakeCase = (val: string) => val
  .replace(/'/g,'')
  .replace(/\W+/g, ' ')
  .split(/ |\B(?=[A-Z])/)
  .map(word => word.toUpperCase())
  .join('_')

const match = ['SAFEAREA', 'OPENPVP_YELLOW', 'OPENPVP_RED', 'PLAYERCITY_BLACK', 'PLAYERCITY_BLACK_ROYAL', 'STARTINGCITY']
const include = ['PLAYERCITY_SAFEAREA_0', 'OPENPVP_BLACK', 'PLAYERCITY_BLACK_PORTALCITY']
const exclude = ['BRECILIEN']
const validNodes = nodes.filter(e => {
  const { enabled, type, displayname } = e._attr
  if (String(enabled) === 'false') return false
  if (exclude.some(m => toSnakeCase(displayname).includes(m))) return false
  if (match.some(m => type === m)) return true
  if (include.some(m => type.includes(m))) return true
  return false
})

export const [ZoneToIdMap, ZoneToNodeMap, ZoneToExitsMap, IdToZoneMap, ZoneToNodePosMap] = validNodes.reduce((acc, val) => {
  const node = val._attr
  const zone = toSnakeCase(node.displayname) as Zone

  acc[0][zone] = node.id
  acc[1][zone] = node
  acc[2][zone] = val.exits.map(e => e._attr)
  acc[3][node.id] = zone
  acc[4][zone] = { x: val.x, y: -val.y }

  return acc
}, [{} as Record<Zone, string>, {} as Record<Zone, AO2DNodeAttrs>, {} as Record<Zone, AO2DExitAttrs[]>, {} as Record<string, Zone>, {} as Record<Zone, { x: number; y: number }>])

export const ZoneToLinksMap = Object.entries(ZoneToExitsMap).reduce((acc, [key, exits]) => {
  const zone = key as Zone
  acc[zone] = []

  for (const exit of exits) {
    const targetId = exit.targetid.split('@')[1]
    const targetZone = IdToZoneMap[targetId]
    if (targetZone) acc[zone].push(IdToZoneMap[targetId])
  }

  return acc
}, {} as Record<Zone, Zone[]>)

// manually connect portals
for (const zone of [Zone.LYMHURST, Zone.FORT_STERLING, Zone.MARTLOCK, Zone.THETFORD, Zone.BRIDGEWATCH]) {
  ZoneToLinksMap[zone].push(`${zone}_PORTAL` as Zone)
  ZoneToLinksMap[`${zone}_PORTAL` as Zone].push(zone)
}

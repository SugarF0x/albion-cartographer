import { Zone, Road } from '/@/data/zone'
import Fuse from 'fuse.js'
import { toSnakeCase } from '/@/data/staticZones'

const ALL_NAMES = (Object.values(Zone) as string[]).concat(Object.values(Road))

const fuse = new Fuse(ALL_NAMES, { includeScore: true })

export function getName(value: string) {
  return fuse.search(toSnakeCase(value))[0].item as Zone | Road
}

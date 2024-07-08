import { inRange } from 'lodash'

/**
 * @throws Error on invalid screenshot or parsing failures
 */

// TODO: avoid multiple reads

export function parse(data: string, mousePos: [x: number, y: number]): Promise<string[]> {
  return new Promise(resolve => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('2D context not available')

      canvas.width = image.width
      canvas.height = image.height

      ctx.drawImage(image, 0, 0)

      const zoneX = BREAKPOINTS.zone[0] * canvas.width
      const zoneY = BREAKPOINTS.zone[1] * canvas.height
      const zoneWidth = BREAKPOINTS.zone[2] * canvas.width
      const zoneHeight = BREAKPOINTS.zone[3] * canvas.height

      const zoneData = ctx.getImageData(zoneX, zoneY, zoneWidth, zoneHeight)

      const zoneCanvas = document.createElement('canvas')
      const zoneCtx = zoneCanvas.getContext('2d', { willReadFrequently: true })
      if (!zoneCtx) throw new Error('2D context not available')

      zoneCanvas.width = zoneWidth
      zoneCanvas.height = zoneHeight

      zoneCtx.putImageData(zoneData, 0, 0)
      const zoneImage = zoneCanvas.toDataURL()

      // validate

      const [diamondX, diamondY] = [zoneCanvas.width * DIAMOND_PIXEL_POS_ASPECT[0], zoneCanvas.height * DIAMOND_PIXEL_POS_ASPECT[1]]
      const diamondPixelData = zoneCtx.getImageData(diamondX, diamondY, 1, 1).data
      console.log(diamondPixelData, diamondX, diamondY)
      const isDiamondValid = DIAMOND_COLORS.some(colors => (
        colors.every((color, index) => (
          inRange(color, diamondPixelData[index] - 1, diamondPixelData[index] + 2)
        ))
      ))

      if (!isDiamondValid) throw new Error('Screenshot is not valid')

      // find portal

      const isLeftSide = mousePos[0] / canvas.width < .5
      function getIterationX(index: number) {
        if (isLeftSide) return mousePos[0] + index
        return mousePos[0] - index
      }

      let portalPos: number[] = []
      for (let i = 1; i < mousePos[0]; i++) {
        const x = getIterationX(i)
        const y = mousePos[1] - i
        const currentPixel = ctx.getImageData(x, y, 1, 1).data
        if (currentPixel.slice(0, 3).some((color, index) => !inRange(color, CHARGE_BORDER_COLOR[index] - 1, CHARGE_BORDER_COLOR[index] + 2))) continue
        portalPos = [x, y]
        break
      }

      if (!portalPos.length) throw new Error('Failed to find portal frame')

      for (let x = portalPos[0]; x > 0; x--) {
        portalPos[0] = x
        const currentPixel = ctx.getImageData(x, portalPos[1], 1, 1).data
        if (currentPixel.slice(0, 3).some((color, index) => !inRange(color, CHARGE_BORDER_COLOR[index] - 1, CHARGE_BORDER_COLOR[index] + 2))) break
        portalPos = [x, portalPos[1]]
      }

      portalPos[0] -= CHARGE_BORDER_X_OFFSET_RATIO * canvas.width
      portalPos[1] -= CHARGE_BORDER_Y_OFFSET_RATIO * canvas.height

      const portalWidth = PORTAL_CARD_SIZE_ASPECT[0] * canvas.width
      const portalHeight = PORTAL_CARD_SIZE_ASPECT[1] * canvas.height
      const [portalX, portalY] = portalPos

      const portalData = ctx.getImageData(portalX, portalY, portalWidth, portalHeight)

      const portalCanvas = document.createElement('canvas')
      const portalCtx = portalCanvas.getContext('2d')
      if (!portalCtx) throw new Error('2D context not available')

      portalCanvas.width = portalWidth
      portalCanvas.height = portalHeight

      portalCtx.putImageData(portalData, 0, 0)
      const portalImage = portalCanvas.toDataURL()

      // extract zone meta data

      const zoneNameX = BREAKPOINTS.zoneName[0] * canvas.width
      const zoneNameY = BREAKPOINTS.zoneName[1] * canvas.height
      const zoneNameWidth = BREAKPOINTS.zoneName[2] * canvas.width
      const zoneNameHeight = BREAKPOINTS.zoneName[3] * canvas.height

      const zoneNameData = zoneCtx.getImageData(zoneNameX, zoneNameY, zoneNameWidth, zoneNameHeight)

      const zoneNameCanvas = document.createElement('canvas')
      const zoneNameCtx = zoneNameCanvas.getContext('2d')
      if (!zoneNameCtx) throw new Error('2D context not available')

      zoneNameCanvas.width = zoneNameWidth
      zoneNameCanvas.height = zoneNameHeight

      zoneNameCtx.putImageData(zoneNameData, 0, 0)
      const zoneNameImage = zoneNameCanvas.toDataURL()

      // TODO: try to figure out of the portal info is present on mouse pos and if so, whether the countdown is red or not

      resolve([zoneImage, portalImage, zoneNameImage])
    }

    image.src = data
  })
}

const ORIGINAL_SIZE = [3840, 2160]

const DIAMOND_COLORS = [
  [61, 103, 156],
  [27, 28, 41],
  [255, 176, 1],
  [255, 2, 0],
]

const BREAKPOINTS = {
  zone: [524 / ORIGINAL_SIZE[0], 55 / ORIGINAL_SIZE[1], 814 / ORIGINAL_SIZE[0], 157 / ORIGINAL_SIZE[1]],
  zoneName: [180 / ORIGINAL_SIZE[0], 19 / ORIGINAL_SIZE[1], 628 / ORIGINAL_SIZE[0], 79 / ORIGINAL_SIZE[1]],
  portalName: [120 / ORIGINAL_SIZE[0], 56 / ORIGINAL_SIZE[1], 578 / ORIGINAL_SIZE[0], 51 / ORIGINAL_SIZE[1]],
  portalTime: [543 / ORIGINAL_SIZE[0], 166 / ORIGINAL_SIZE[1], 162 / ORIGINAL_SIZE[0], 47 / ORIGINAL_SIZE[1]],
} satisfies Record<string, [x: number, y: number, width: number, height: number]>

const PORTAL_CARD_SIZE_ASPECT = [720 / ORIGINAL_SIZE[0], 225 / ORIGINAL_SIZE[1]]
const DIAMOND_PIXEL_POS_ASPECT = [90 / (BREAKPOINTS.zone[2] * ORIGINAL_SIZE[0]), 90 / (BREAKPOINTS.zone[3] * ORIGINAL_SIZE[1])]

const CHARGE_BORDER_COLOR = [126, 116, 120]
const CHARGE_BORDER_X_OFFSET_RATIO = 20 / ORIGINAL_SIZE[0]
const CHARGE_BORDER_Y_OFFSET_RATIO = 154 / ORIGINAL_SIZE[1]

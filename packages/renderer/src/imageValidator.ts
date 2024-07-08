// import { inRange } from 'lodash'

export function validate(data: string, mousePos: [x: number, y: number]): Promise<string[]> {
  return new Promise(resolve => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('2D context not available')

      canvas.width = image.width
      canvas.height = image.height

      ctx.drawImage(image, 0, 0)

      // const [diamondX, diamondY] = [canvas.width * DIAMOND_COORDS_ASPECT[0], canvas.height * DIAMOND_COORDS_ASPECT[1]]
      // const pixelData = ctx.getImageData(diamondX, diamondY, 1, 1).data
      // const isDiamondValid = DIAMOND_COLORS.some(colors => (
      //   colors.every((color, index) => (
      //     inRange(color, pixelData[index] - 1, pixelData[index] + 2)
      //   ))
      // ))

      const zoneX = BREAKPOINTS.zone[0] * canvas.width
      const zoneY = BREAKPOINTS.zone[1] * canvas.height
      const zoneWidth = BREAKPOINTS.zone[2] * canvas.width
      const zoneHeight = BREAKPOINTS.zone[3] * canvas.height

      const zoneData = ctx.getImageData(zoneX, zoneY, zoneWidth, zoneHeight)

      const zoneCanvas = document.createElement('canvas')
      const zoneCtx = zoneCanvas.getContext('2d')
      if (!zoneCtx) throw new Error('2D context not available')

      zoneCanvas.width = zoneWidth
      zoneCanvas.height = zoneHeight

      zoneCtx.putImageData(zoneData, 0, 0)
      const zoneImage = zoneCanvas.toDataURL()

      // find portal

      let portalPos: number[] = []
      $: if (mousePos[0] / canvas.width < .5) {
        for (let y = mousePos[1]; y > y - 10; y--) {
          for (let x = mousePos[0]; x < x + 10; x++) {
            const previousPixel = ctx.getImageData(x-1, y, 1, 1).data
            const currentPixel = ctx.getImageData(x, y, 1, 1).data
            if (isDrasticChange(previousPixel, currentPixel, 50)) {
              portalPos = [x, y]
              break $
            }
          }
        }
      } else {
        console.log('unsupported yet')
        resolve([zoneImage])
        return
      }

      console.log('potal pos', portalPos)

      const portalWidth = PORTAL_CARD_SIZE_ASPECT[0] * canvas.width
      const portalHeight = PORTAL_CARD_SIZE_ASPECT[1] * canvas.height
      const portalX = portalPos[0]
      const portalY = portalPos[1] - portalHeight

      const portalData = ctx.getImageData(portalX, portalY, portalWidth, portalHeight)

      const portalCanvas = document.createElement('canvas')
      const portalCtx = portalCanvas.getContext('2d')
      if (!portalCtx) throw new Error('2D context not available')

      portalCanvas.width = portalWidth
      portalCanvas.height = portalHeight

      portalCtx.putImageData(portalData, 0, 0)
      const portalImage = portalCanvas.toDataURL()

      // TODO: try to figure out of the portal info is present on mouse pos and if so, whether the countdown is red or not

      resolve([zoneImage, portalImage])
    }

    image.src = data
  })
}

const ORIGINAL_SIZE = [3840, 2160]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DIAMOND_COLORS = [
  [61, 103, 156],
  [27, 28, 41],
  [255, 176, 1],
  [255, 2, 0],
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PORTAL_CARD_SIZE_ASPECT = [720 / ORIGINAL_SIZE[0], 225 / ORIGINAL_SIZE[1]]
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DIAMOND_PIXEL_POS_ASPECT = [90 / ORIGINAL_SIZE[0], 90 / ORIGINAL_SIZE[1]]
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BREAKPOINTS: Record<string, [x: number, y: number, width: number, height: number]> = {
  zone: [524 / ORIGINAL_SIZE[0], 55 / ORIGINAL_SIZE[1], 814 / ORIGINAL_SIZE[0], 157 / ORIGINAL_SIZE[1]],
  zoneName: [117 / ORIGINAL_SIZE[0], 19 / ORIGINAL_SIZE[1], 628 / ORIGINAL_SIZE[0], 79 / ORIGINAL_SIZE[1]],
  portalName: [120 / ORIGINAL_SIZE[0], 56 / ORIGINAL_SIZE[1], 578 / ORIGINAL_SIZE[0], 51 / ORIGINAL_SIZE[1]],
  portalTime: [543 / ORIGINAL_SIZE[0], 166 / ORIGINAL_SIZE[1], 162 / ORIGINAL_SIZE[0], 47 / ORIGINAL_SIZE[1]],
}

function isDrasticChange(prevPixel: Uint8ClampedArray, currentPixel: Uint8ClampedArray, threshold: number) {
  const [pR, pG, pB] = prevPixel
  const [cR, cG, cB] = currentPixel

  const rDiff = Math.abs(cR - pR)
  const gDiff = Math.abs(cG - pG)
  const bDiff = Math.abs(cB - pB)

  const diff = rDiff + gDiff + bDiff
  return diff > threshold
}

import { inRange } from 'lodash'

export function validate(data: string): Promise<boolean> {
  return new Promise(resolve => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2D context not available')

      canvas.width = image.width
      canvas.height = image.height

      ctx.drawImage(image, 0, 0)

      const [diamondX, diamondY] = [canvas.width * DIAMOND_COORDS_ASPECT[0], canvas.height * DIAMOND_COORDS_ASPECT[1]]
      const pixelData = ctx.getImageData(diamondX, diamondY, 1, 1).data
      const isDiamondValid = DIAMOND_COLORS.some(colors => (
        colors.every((color, index) => (
          inRange(color, pixelData[index] - 1, pixelData[index] + 2)
        ))
      ))

      // TODO: try to figure out of the portal info is present on mouse pos and if so, whether the countdown is red or not

      resolve(isDiamondValid)
    }

    image.src = data
  })
}

const ORIGINAL_SIZE = [3840, 2160]

const DIAMOND_COORDS_ASPECT = [615 / ORIGINAL_SIZE[0], 150 / ORIGINAL_SIZE[1]]
const DIAMOND_COLORS = [
  [61, 103, 156],
  [27, 28, 41],
  [255, 176, 1],
  [255, 2, 0],
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PORTAL_CARD_SIZE_ASPECT = [720 / ORIGINAL_SIZE[0], 225 / ORIGINAL_SIZE[1]]
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BREAKPOINTS: Record<string, [x: number, y: number, width: number, height: number]> = {
  zone: [524 / ORIGINAL_SIZE[0], 55 / ORIGINAL_SIZE[1], 814 / ORIGINAL_SIZE[0], 157 / ORIGINAL_SIZE[1]],
  zoneName: [117 / ORIGINAL_SIZE[0], 19 / ORIGINAL_SIZE[1], 628 / ORIGINAL_SIZE[0], 79 / ORIGINAL_SIZE[1]],
  portalName: [120 / ORIGINAL_SIZE[0], 56 / ORIGINAL_SIZE[1], 578 / ORIGINAL_SIZE[0], 51 / ORIGINAL_SIZE[1]],
  portalTime: [543 / ORIGINAL_SIZE[0], 166 / ORIGINAL_SIZE[1], 162 / ORIGINAL_SIZE[0], 47 / ORIGINAL_SIZE[1]],
}


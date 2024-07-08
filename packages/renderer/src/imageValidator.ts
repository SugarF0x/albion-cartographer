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

const DIAMOND_COORDS_ASPECT = [615 / 3840, 150 / 2160]
const DIAMOND_COLORS = [
  [61, 103, 156],
  [27, 28, 41],
  [255, 176, 1],
  [255, 2, 0],
]

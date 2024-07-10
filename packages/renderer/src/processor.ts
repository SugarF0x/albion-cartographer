interface TimeMeta {
  isRed: boolean
}

export function preprocessImageForOCR(data: string, options?: { time?: boolean }): Promise<{ image: string, meta?: TimeMeta }> {
  const { time } = options ?? {}

  return new Promise(resolve => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('2D context not available')

      canvas.width = image.width
      canvas.height = image.height

      ctx.drawImage(image, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const meta = getTimeMeta(imageData, time)
      toGrayscale(ctx, imageData)
      increaseContrast(ctx, imageData)
      reduceNoise(canvas, ctx, imageData)
      otsuBinarize(ctx, imageData)
      invertToBlack(canvas, ctx)
      if (time) removeSmallCharacters(canvas, ctx)

      resolve({ image: canvas.toDataURL(), meta })
    }

    image.src = data
  })
}

function getTimeMeta(imageData: ImageData, time?: boolean): TimeMeta | undefined {
  if (!time) return undefined

  const { data } = imageData
  for (let i = 0; i < data.length; i+=4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (r > 200 && g < 100 && b < 100) return { isRed: true }
  }

  return { isRed: false }
}

function toGrayscale(ctx: CanvasRenderingContext2D, imageData: ImageData) {
  const { data } = imageData

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    data[i] = data[i + 1] = data[i + 2] = gray
  }

  ctx.putImageData(imageData, 0, 0)
}

function increaseContrast(ctx: CanvasRenderingContext2D, imageData: ImageData) {
  const { data } = imageData
  const contrastFactor = (259 * (128 + 255)) / (255 * (259 - 128))

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = contrastFactor * (data[i] - 128) + 128
  }

  ctx.putImageData(imageData, 0, 0)
}

function reduceNoise(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, imageData: ImageData) {
  const { data } = imageData

  const filteredData = new Uint8ClampedArray(data)

  const width = canvas.width
  const height = canvas.height

  const getPixel = (x: number, y: number, data: Uint8ClampedArray) => {
    const index = (y * width + x) * 4
    // Since the image is grayscale, r, g, and b are the same
    return data[index]
  }

  const setPixel = (x: number, y: number, value: number, data: Uint8ClampedArray) => {
    const index = (y * width + x) * 4
    data[index] = data[index + 1] = data[index + 2] = value
  }

  const windowSize = 3
  const halfWindowSize = Math.floor(windowSize / 2)

  for (let y = halfWindowSize; y < height - halfWindowSize; y++) {
    for (let x = halfWindowSize; x < width - halfWindowSize; x++) {
      const window: number[] = []

      for (let ky = -halfWindowSize; ky <= halfWindowSize; ky++) {
        for (let kx = -halfWindowSize; kx <= halfWindowSize; kx++) {
          window.push(getPixel(x + kx, y + ky, data))
        }
      }

      window.sort((a, b) => a - b)
      const median = window[Math.floor(window.length / 2)]
      setPixel(x, y, median, filteredData)
    }
  }

  ctx.putImageData(new ImageData(filteredData, width, height), 0, 0)
}

function getOtsuThreshold(data: Uint8ClampedArray): number {
  const histogram = new Array(256).fill(0)

  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++
  }

  const total = data.length / 4
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]

  let sumB = 0
  let wB = 0
  let wF = 0
  let mB = 0
  let mF = 0
  let max = 0
  let threshold = 0

  for (let i = 0; i < 256; i++) {
    wB += histogram[i]
    if (wB === 0) continue

    wF = total - wB
    if (wF === 0) break

    sumB += i * histogram[i]
    mB = sumB / wB
    mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) * (mB - mF)

    if (between > max) {
      max = between
      threshold = i
    }
  }

  return threshold
}

function otsuBinarize(ctx: CanvasRenderingContext2D, imageData: ImageData) {
  const { data } = imageData
  const otsuThreshold = getOtsuThreshold(data)

  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > otsuThreshold ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = value
  }

  ctx.putImageData(imageData, 0, 0)
}

function invertToBlack(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  if (data[0] < 128) return
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4
      const target = data[index] < 128 ? 255 : 0
      data[index] = target
      data[index + 1] = target
      data[index + 2] = target
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

function removeSmallCharacters(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const boundingBoxes = findBoundingBoxes(data, canvas.width, canvas.height)

  const maxBoxHeight = boundingBoxes.reduce((acc, val) => Math.max(acc, val.height), 0)
  const heightThreshold = maxBoxHeight * .9
  const filteredBoxes = boundingBoxes.filter(box => box.height > heightThreshold)

  const boxesData = filteredBoxes.map(box => ctx.getImageData(box.x, box.y, box.width, box.height))
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  filteredBoxes.forEach((box, index) => {
    ctx.putImageData(boxesData[index], box.x, box.y)
  })
}

function findBoundingBoxes(data: Uint8ClampedArray, width: number, height: number) {
  const boxes: { x: number, y: number, width: number, height: number }[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      if (data[index] < 128) continue

      const box = floodFill(data, width, height, x, y)
      if (box) boxes.push(box)
    }
  }

  return boxes
}

function floodFill(data: Uint8ClampedArray, width: number, height: number, startX: number, startY: number) {
  const stack = [[startX, startY]]
  let minX = startX
  let maxX = startX
  let minY = startY
  let maxY = startY

  while (stack.length) {
    const item = stack.pop()
    if (!item) throw new Error('oops')
    const [x, y] = item

    if (x < 0 || x >= width || y < 0 || y >= height) continue
    const index = (y * width + x) * 4
    if (data[index] < 128) continue
    data[index] = 0

    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  if (maxX - minX < 2 || maxY - minY < 2) return null
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

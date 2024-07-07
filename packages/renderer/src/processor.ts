export function preprocessImageForOCR(data: string): Promise<string> {
  return new Promise(resolve => {
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('2D context not available')

      canvas.width = image.width
      canvas.height = image.height

      ctx.drawImage(image, 0, 0)

      // Convert to grayscale
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        data[i] = data[i + 1] = data[i + 2] = gray
      }

      ctx.putImageData(imageData, 0, 0)

      // Increase contrast (simple contrast adjustment)
      const contrastFactor = (259 * (128 + 255)) / (255 * (259 - 128))

      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i + 1] = data[i + 2] = contrastFactor * (data[i] - 128) + 128
      }

      ctx.putImageData(imageData, 0, 0)

      // Apply a simple median filter for noise reduction
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

      // Binarization using Otsu's method
      const otsuThreshold = getOtsuThreshold(data)

      for (let i = 0; i < data.length; i += 4) {
        const value = data[i] > otsuThreshold ? 255 : 0
        data[i] = data[i + 1] = data[i + 2] = value
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL())
    }

    image.src = data
  })
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

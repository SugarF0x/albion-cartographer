import { clipboard, nativeImage } from 'electron'

export function copyImage(dataURL: string) {
  const image = nativeImage.createFromDataURL(dataURL)
  clipboard.writeImage(image)
}
import { clipboard, nativeImage } from 'electron'

export function copyImage(dataURL: string) {
  const image = nativeImage.createFromDataURL(dataURL)
  clipboard.writeImage(image)
}

export function copyText(text: string) {
  clipboard.writeText(text)
}
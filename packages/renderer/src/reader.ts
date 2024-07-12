import { createWorker } from 'tesseract.js'
import { hoursToMilliseconds, minutesToMilliseconds, secondsToMilliseconds } from 'date-fns'
import { getName } from '/@/fuzeZoneName'
import { getPublicAssetPath } from '/@/getPublicAssetPath'

export async function read(input: { image: string, meta?: { isRed: boolean } }): Promise<string | number> {
  const { image, meta } = input

  const worker = await createWorker('eng', 1, {
    workerPath: getPublicAssetPath('/ocr/worker.js'),
    corePath: getPublicAssetPath('/ocr/core.js'),
    langPath: getPublicAssetPath('/ocr/langs/'),
  })

  if (meta) await worker.setParameters({ tessedit_char_whitelist: ' 0123456789' })

  const ret = await worker.recognize(image)
  await worker.terminate()
  const text = ret.data.text

  if (!meta) return getName(text)

  const timeElements = Object.assign([0, 0], text.trim().split(' ').map(Number))
  if (timeElements.at(-1) === 0) timeElements.reverse()

  if (!meta.isRed) return hoursToMilliseconds(timeElements[0]) + minutesToMilliseconds(timeElements[1] ?? 0)
  return minutesToMilliseconds(timeElements[0]) + secondsToMilliseconds(timeElements[1] ?? 0)
}

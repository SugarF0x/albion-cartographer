import { createWorker } from 'tesseract.js'
import { hoursToMilliseconds, minutesToMilliseconds, secondsToMilliseconds } from 'date-fns'
import { getName } from '/@/fuzeZoneName'

export async function read(input: { image: string, meta?: { isRed: boolean } }): Promise<string | number> {
  const { image, meta } = input

  const worker = await createWorker('eng', 1, {
    workerPath: `${location.origin}/ocr/worker.js`,
    corePath: `${location.origin}/ocr/core.js`,
  })

  if (meta) await worker.setParameters({ tessedit_char_whitelist: ' 0123456789' })

  const ret = await worker.recognize(image)
  await worker.terminate()
  const text = ret.data.text

  console.log('read: ', text)
  if (!meta) return getName(text)

  const timeElements = text.split(' ').map(Number)
  if (!meta.isRed) return hoursToMilliseconds(timeElements[0]) + minutesToMilliseconds(timeElements[1])
  return minutesToMilliseconds(timeElements[0]) + secondsToMilliseconds(timeElements[1])
}

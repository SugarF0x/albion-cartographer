import { createWorker } from 'tesseract.js'
import { hoursToMilliseconds, minutesToMilliseconds, secondsToMilliseconds } from 'date-fns'
import { getName } from '/@/fuzeZoneName'

export async function read(input: { image: string, meta?: { isRed: boolean } }): Promise<string | number> {
  const { image, meta } = input

  /**
   * Path to renderer root dir at current protocol in both DEV and PROD
   */
  let base = location.href
  if (base.at(-1) !== '/') base = base.split('/').slice(0,base.split('/').length-1).join('/')
  else base = base.slice(0,base.length-1)

  const worker = await createWorker('eng', 1, {
    workerPath: `${base}/ocr/worker.js`,
    corePath: `${base}/ocr/core.js`,
    langPath: `${base}/ocr/langs/`,
  })

  if (meta) await worker.setParameters({ tessedit_char_whitelist: ' 0123456789' })

  const ret = await worker.recognize(image)
  await worker.terminate()
  const text = ret.data.text

  if (!meta) return getName(text)

  // TODO: account for time without minutes / seconds (second value)
  const timeElements = text.split(' ').map(Number)
  if (!meta.isRed) return hoursToMilliseconds(timeElements[0]) + minutesToMilliseconds(timeElements[1])
  return minutesToMilliseconds(timeElements[0]) + secondsToMilliseconds(timeElements[1])
}

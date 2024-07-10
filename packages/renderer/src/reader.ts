import { createWorker } from 'tesseract.js'

export async function read(data: string, time?: boolean): Promise<string> {
  const worker = await createWorker('eng', 1, {
    workerPath: `${location.origin}/ocr/worker.js`,
    corePath: `${location.origin}/ocr/core.js`,
  })

  if (time) await worker.setParameters({ tessedit_char_whitelist: ' 0123456789' })

  const ret = await worker.recognize(data)
  await worker.terminate()
  return ret.data.text
}

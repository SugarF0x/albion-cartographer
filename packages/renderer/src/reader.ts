import { createWorker } from 'tesseract.js'

export async function read(data: string): Promise<string> {
  const worker = await createWorker(['eng', 'rus'], 1, {
    workerPath: `${location.origin}/ocr/worker.js`,
    corePath: `${location.origin}/ocr/core.js`,
  })

  const ret = await worker.recognize(data)
  await worker.terminate()
  return ret.data.text
}

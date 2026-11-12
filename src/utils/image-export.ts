export type ImageOutputType = 'image/jpeg' | 'image/png' | 'image/webp'

export const imageOutputTypes: ImageOutputType[] = ['image/jpeg', 'image/png', 'image/webp']

export const isSupportedImageFile = (file: File) =>
  file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)

export const loadImage = async (file: File) => {
  let imageBlob: Blob = file
  if (/\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]/i.test(file.type)) {
    try {
      const { heicTo, isHeic } = await import('heic-to/csp')
      if (await isHeic(file)) {
        imageBlob = await heicTo({ blob: file, type: 'image/png' })
      }
    } catch {
      throw new Error('HEIC/HEIF 图片解码失败，请确认文件有效后重试')
    }
  }

  return new Promise<{ file: File; image: HTMLImageElement; url: string }>((resolve, reject) => {
    const url = URL.createObjectURL(imageBlob)
    const image = new Image()
    image.onload = () => resolve({ file, image, url })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('浏览器无法解码此图片格式'))
    }
    image.src = url
  })
}

export const canvasToBlob = (canvas: HTMLCanvasElement, type: ImageOutputType) => {
  if (type !== 'image/png') {
    return encodeImage(canvas, type)
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('图片导出失败'))
        return
      }
      resolve(await optimisePng(blob).catch(() => blob))
    }, 'image/png')
  })
}

interface EncoderResponse {
  id: number
  buffer?: ArrayBuffer
  imageData?: { buffer: ArrayBuffer; width: number; height: number }
  error?: string
}

let encoderWorker: Worker | undefined
let nextEncodeId = 0
const pendingEncodes = new Map<
  number,
  { resolve: (response: EncoderResponse) => void; reject: (error: Error) => void }
>()

const getEncoderWorker = () => {
  if (encoderWorker) return encoderWorker

  encoderWorker = new Worker(new URL('./image-encoder.worker.ts', import.meta.url), {
    type: 'module',
  })
  encoderWorker.onmessage = (event: MessageEvent<EncoderResponse>) => {
    const pending = pendingEncodes.get(event.data.id)
    if (!pending) return

    pendingEncodes.delete(event.data.id)
    pending.resolve(event.data)
  }
  encoderWorker.onerror = () => {
    const failedWorker = encoderWorker
    encoderWorker = undefined
    failedWorker?.terminate()
    pendingEncodes.forEach(({ reject }, id) => {
      reject(new Error('图片编码器启动失败，请重试'))
    })
    pendingEncodes.clear()
  }

  return encoderWorker
}

const requestWorker = (message: Record<string, unknown>, transfer: Transferable[]) =>
  new Promise<EncoderResponse>((resolve, reject) => {
    const id = nextEncodeId++
    pendingEncodes.set(id, { resolve, reject })
    try {
      getEncoderWorker().postMessage({ ...message, id }, transfer)
    } catch {
      pendingEncodes.delete(id)
      reject(new Error('无法启动图片编码器，请重试'))
    }
  })

const optimisePng = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer()
  const response = await requestWorker({ operation: 'optimise-png', buffer }, [buffer])
  if (!response.buffer) throw new Error(response.error || 'PNG 优化失败')
  return new Blob([response.buffer], { type: 'image/png' })
}

export const resizeImageData = async (imageData: ImageData, width: number, height: number) => {
  const response = await requestWorker(
    { operation: 'resize', imageData, width, height },
    [imageData.data.buffer],
  )
  if (!response.imageData) throw new Error(response.error || '图片缩放失败')
  return new ImageData(
    new Uint8ClampedArray(response.imageData.buffer),
    response.imageData.width,
    response.imageData.height,
  )
}

const encodeImage = (canvas: HTMLCanvasElement, type: ImageOutputType) =>
  new Promise<Blob>((resolve, reject) => {
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) {
      reject(new Error('当前浏览器不支持图片处理'))
      return
    }

    let imageData: ImageData
    try {
      imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    } catch {
      reject(new Error('无法读取画布像素，请确认图片未超出浏览器处理限制'))
      return
    }

    requestWorker(
      { operation: 'encode', imageData, type },
      [imageData.data.buffer],
    ).then((response) => {
      if (response.buffer) resolve(new Blob([response.buffer], { type }))
      else reject(new Error(response.error || '图片编码失败'))
    }, reject)
  })

export const replaceExtension = (filename: string, type: ImageOutputType) => {
  const extension = type.split('/')[1].replace('jpeg', 'jpg')
  return filename.replace(/\.[^/.]+$/, '') + `.${extension}`
}

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

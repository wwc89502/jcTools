import type { ImageOutputType } from './image-export'

interface EncodeRequest {
  id: number
  operation: 'encode' | 'optimise-png' | 'resize'
  imageData: ImageData
  type?: ImageOutputType
  buffer?: ArrayBuffer
  width?: number
  height?: number
}

const workerScope = self as unknown as {
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<EncodeRequest>) => void,
  ) => void
  postMessage: (message: unknown, transfer?: Transferable[]) => void
}

workerScope.addEventListener('message', async (event: MessageEvent<EncodeRequest>) => {
  const { id, operation, imageData, type, buffer, width, height } = event.data

  try {
    if (operation === 'optimise-png') {
      if (!buffer) throw new Error('PNG 数据缺失')
      const { optimise } = await import('@jsquash/oxipng')
      const optimizedBuffer = await optimise(buffer, { level: 3 })
      workerScope.postMessage({ id, buffer: optimizedBuffer }, [optimizedBuffer])
      return
    }

    if (operation === 'resize') {
      if (!imageData || !width || !height) throw new Error('缩放参数缺失')
      const resize = (await import('@jsquash/resize')).default
      const resized = await resize(imageData, {
        width,
        height,
        method: 'lanczos3',
        fitMethod: 'stretch',
        premultiply: true,
        linearRGB: true,
      })
      workerScope.postMessage(
        { id, imageData: { buffer: resized.data.buffer, width, height } },
        [resized.data.buffer],
      )
      return
    }

    if (!imageData || !type) throw new Error('编码参数缺失')
    let encodedBuffer: ArrayBuffer
    if (type === 'image/jpeg') {
      const { default: encode } = await import('@jsquash/jpeg/encode')
      encodedBuffer = await encode(imageData, {
        quality: 100,
        progressive: true,
        optimize_coding: true,
        trellis_multipass: true,
      })
    } else {
      const { default: encode } = await import('@jsquash/webp/encode')
      encodedBuffer = await encode(imageData, {
        quality: 100,
        method: 6,
        lossless: 1,
        exact: 1,
      })
    }

    workerScope.postMessage({ id, buffer: encodedBuffer }, [encodedBuffer])
  } catch (error) {
    workerScope.postMessage({
      id,
      error: error instanceof Error ? error.message : '图片编码失败',
    })
  }
})

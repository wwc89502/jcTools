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

export const canvasToBlob = (
  canvas: HTMLCanvasElement,
  type: ImageOutputType,
  quality: number,
) => {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片导出失败'))),
      type,
      quality,
    )
  })
}

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

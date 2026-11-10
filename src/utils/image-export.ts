export type ImageOutputType = 'image/jpeg' | 'image/png' | 'image/webp'

export const imageOutputTypes: ImageOutputType[] = ['image/jpeg', 'image/png', 'image/webp']

export const loadImage = (file: File) => {
  return new Promise<{ file: File; image: HTMLImageElement; url: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ file, image, url })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
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

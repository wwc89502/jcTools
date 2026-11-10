<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import {
  Aim,
  Back,
  Bottom,
  BottomLeft,
  BottomRight,
  Right,
  Top,
  TopLeft,
  TopRight,
  UploadFilled,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import AspectRatioToggle from './AspectRatioToggle.vue'
import {
  canvasToBlob,
  downloadBlob,
  isSupportedImageFile,
  imageOutputTypes,
  loadImage,
  replaceExtension,
  type ImageOutputType,
} from '@/utils/image-export'

const props = defineProps<{ mode: 'canvas' | 'image' }>()
const MAX_CANVAS_PIXELS = 40_000_000

const sourceFile = ref<File>()
const sourceImage = ref<HTMLImageElement>()
const sourceUrl = ref('')
const width = ref(0)
const height = ref(0)
const quality = ref(90)
const outputType = ref<ImageOutputType>('image/jpeg')
const processing = ref(false)
const previewCanvas = ref<HTMLCanvasElement>()
const aspectRatioLocked = ref(true)
const canvasAspectRatio = ref(1)
const imageAspectRatioLocked = ref(true)
const imageAspectRatio = ref(1)
const showOriginalPreview = ref(false)
const constrainImageToCanvas = ref(false)
const canvasAlignment = ref('center')
const imageWidth = ref(0)
const imageHeight = ref(0)
const imagePosition = ref({ x: 0, y: 0 })
const dragState = ref<{ pointerId: number; startX: number; startY: number; imageX: number; imageY: number }>()

const alignmentOptions = [
  { value: 'top-left', label: '左上', icon: TopLeft },
  { value: 'top-center', label: '上中', icon: Top },
  { value: 'top-right', label: '右上', icon: TopRight },
  { value: 'middle-left', label: '左中', icon: Back },
  { value: 'center', label: '居中', icon: Aim },
  { value: 'middle-right', label: '右中', icon: Right },
  { value: 'bottom-left', label: '左下', icon: BottomLeft },
  { value: 'bottom-center', label: '下中', icon: Bottom },
  { value: 'bottom-right', label: '右下', icon: BottomRight },
]

const title = computed(() => (props.mode === 'canvas' ? '单图画布调整' : '单图调整'))
const description = computed(() =>
  props.mode === 'canvas'
    ? '调整画布尺寸、图片大小和位置，补充区域保持透明。'
    : '调整图片像素尺寸，图片内容会按目标宽高缩放。',
)
const outputLabel = computed(() => outputType.value.split('/')[1].toUpperCase())
const previewScale = computed(() => {
  if (!width.value || !height.value) return 1
  return Math.min(1, 720 / width.value, 480 / height.value)
})
const previewScaleLabel = computed(() => `${Math.round(previewScale.value * 100)}%`)
const qualityDisabled = computed(() => outputType.value === 'image/png')
const jpegTransparencyHint = computed(() => outputType.value === 'image/jpeg' && !!sourceImage.value)
const aspectRatio = computed(() =>
  sourceImage.value?.naturalWidth && sourceImage.value?.naturalHeight
    ? sourceImage.value.naturalWidth / sourceImage.value.naturalHeight
    : 1,
)
const isCanvasTooLarge = computed(() => width.value * height.value > MAX_CANVAS_PIXELS)
const currentAlignmentLabel = computed(() =>
  canvasAlignment.value === 'custom'
    ? '自定义拖拽'
    : alignmentOptions.find((option) => option.value === canvasAlignment.value)?.label,
)

const getOutputType = (fileType: string): ImageOutputType =>
  imageOutputTypes.includes(fileType as ImageOutputType)
    ? (fileType as ImageOutputType)
    : 'image/jpeg'

const getCanvasImageSize = () => ({
  width: props.mode === 'canvas' ? imageWidth.value : width.value,
  height: props.mode === 'canvas' ? imageHeight.value : height.value,
})

const getAlignmentOffset = (containerSize: number, imageSize: number, axis: 'x' | 'y') => {
  const position = canvasAlignment.value.split('-')
  const edge = axis === 'x' ? position[position.length - 1] : position[0]
  if (edge === 'left' || edge === 'top') return 0
  if (edge === 'right' || edge === 'bottom') return containerSize - imageSize
  return (containerSize - imageSize) / 2
}

const getImagePlacement = () => {
  const imageSize = getCanvasImageSize()
  if (props.mode === 'canvas' && canvasAlignment.value === 'custom') {
    return imagePosition.value
  }
  return {
    x: getAlignmentOffset(width.value, imageSize.width, 'x'),
    y: getAlignmentOffset(height.value, imageSize.height, 'y'),
  }
}

const clampImagePosition = (position: { x: number; y: number }) => {
  const imageSize = getCanvasImageSize()
  if (constrainImageToCanvas.value) {
    return {
      x:
        imageSize.width >= width.value
          ? 0
          : Math.round(Math.min(width.value - imageSize.width, Math.max(0, position.x))),
      y:
        imageSize.height >= height.value
          ? 0
          : Math.round(Math.min(height.value - imageSize.height, Math.max(0, position.y))),
    }
  }
  return {
    x: Math.round(Math.min(width.value - 1, Math.max(1 - imageSize.width, position.x))),
    y: Math.round(Math.min(height.value - 1, Math.max(1 - imageSize.height, position.y))),
  }
}

const syncAlignmentPosition = () => {
  if (props.mode !== 'canvas' || canvasAlignment.value === 'custom') return
  const imageSize = getCanvasImageSize()
  imagePosition.value = {
    x: getAlignmentOffset(width.value, imageSize.width, 'x'),
    y: getAlignmentOffset(height.value, imageSize.height, 'y'),
  }
}

const selectAlignment = (value: string) => {
  canvasAlignment.value = value
  syncAlignmentPosition()
}

const handleDimensionChange = (
  axis: 'width' | 'height',
  value: number | null | undefined,
) => {
  if (!aspectRatioLocked.value || !sourceImage.value) return
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 1) return
  const ratio = props.mode === 'canvas' ? canvasAspectRatio.value : aspectRatio.value
  if (axis === 'width') {
    height.value = Math.max(1, Math.round(numericValue / ratio))
  } else {
    width.value = Math.max(1, Math.round(numericValue * ratio))
  }
}

const toggleAspectRatio = (value: boolean | string | number) => {
  if (value && props.mode === 'canvas') canvasAspectRatio.value = width.value / height.value
  aspectRatioLocked.value = Boolean(value)
  if (aspectRatioLocked.value) handleDimensionChange('width', width.value)
}

const handleImageDimensionChange = (
  axis: 'width' | 'height',
  value: number | null | undefined,
) => {
  if (!imageAspectRatioLocked.value || !sourceImage.value) return
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 1) return
  if (axis === 'width') {
    imageHeight.value = Math.max(1, Math.round(numericValue / imageAspectRatio.value))
  } else {
    imageWidth.value = Math.max(1, Math.round(numericValue * imageAspectRatio.value))
  }
}

const toggleImageAspectRatio = (value: boolean) => {
  if (value) imageAspectRatio.value = imageWidth.value / imageHeight.value
  imageAspectRatioLocked.value = value
}

const normalizeCustomPosition = () => {
  imagePosition.value = clampImagePosition(imagePosition.value)
}

const toggleCanvasBounds = (value: boolean | string | number) => {
  constrainImageToCanvas.value = Boolean(value)
  normalizeCustomPosition()
}

const drawPreview = async () => {
  await nextTick()
  const canvas = previewCanvas.value
  const image = sourceImage.value
  if (!canvas || !image || !width.value || !height.value) return

  const scale = previewScale.value
  const targetWidth = Math.max(1, Math.round(width.value * scale))
  const targetHeight = Math.max(1, Math.round(height.value * scale))
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, targetWidth, targetHeight)
  if (outputType.value === 'image/jpeg') {
    context.fillStyle = '#fff'
    context.fillRect(0, 0, targetWidth, targetHeight)
  }

  if (props.mode === 'canvas') {
    const imageSize = getCanvasImageSize()
    const placement = getImagePlacement()
    context.drawImage(
      image,
      placement.x * scale,
      placement.y * scale,
      imageSize.width * scale,
      imageSize.height * scale,
    )
  } else {
    context.drawImage(image, 0, 0, targetWidth, targetHeight)
  }
}

const handleFileChange = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw as File | undefined
  if (!file) return
  if (!isSupportedImageFile(file)) {
    ElMessage.error('请选择图片文件')
    return
  }

  try {
    if (file.type === 'image/gif' || /\.gif$/i.test(file.name)) {
      ElMessage.warning('GIF 动图会按首帧处理，导出后不保留动画')
    }
    const loaded = await loadImage(file)
    if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
    sourceFile.value = loaded.file
    sourceImage.value = loaded.image
    sourceUrl.value = loaded.url
    outputType.value = getOutputType(loaded.file.type)
    width.value = loaded.image.naturalWidth
    height.value = loaded.image.naturalHeight
    imageWidth.value = loaded.image.naturalWidth
    imageHeight.value = loaded.image.naturalHeight
    aspectRatioLocked.value = true
    canvasAspectRatio.value = loaded.image.naturalWidth / loaded.image.naturalHeight
    imageAspectRatioLocked.value = true
    imageAspectRatio.value = canvasAspectRatio.value
    showOriginalPreview.value = false
    constrainImageToCanvas.value = false
    canvasAlignment.value = 'center'
    syncAlignmentPosition()
    drawPreview()
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '图片加载失败')
  }
}

const reset = () => {
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
  sourceFile.value = undefined
  sourceImage.value = undefined
  sourceUrl.value = ''
  width.value = 0
  height.value = 0
  imageWidth.value = 0
  imageHeight.value = 0
  imagePosition.value = { x: 0, y: 0 }
  dragState.value = undefined
  aspectRatioLocked.value = true
  canvasAspectRatio.value = 1
  imageAspectRatioLocked.value = true
  imageAspectRatio.value = 1
  showOriginalPreview.value = false
  constrainImageToCanvas.value = false
}

watch(
  [sourceImage, width, height, imageWidth, imageHeight, canvasAlignment, outputType],
  () => {
    syncAlignmentPosition()
    if (imageWidth.value > width.value || imageHeight.value > height.value) {
      constrainImageToCanvas.value = false
    }
    if (props.mode === 'canvas' && canvasAlignment.value === 'custom') {
      normalizeCustomPosition()
    }
    drawPreview()
  },
  { flush: 'post' },
)
watch(imagePosition, () => drawPreview(), { deep: true, flush: 'post' })
watch(showOriginalPreview, () => drawPreview(), { flush: 'post' })

const getPreviewPoint = (event: PointerEvent) => {
  const canvas = previewCanvas.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * width.value,
    y: ((event.clientY - rect.top) / rect.height) * height.value,
  }
}

const handlePreviewPointerDown = (event: PointerEvent) => {
  if (props.mode !== 'canvas' || canvasAlignment.value !== 'custom') return
  const point = getPreviewPoint(event)
  const placement = getImagePlacement()
  const imageSize = getCanvasImageSize()
  if (
    point.x < placement.x ||
    point.x > placement.x + imageSize.width ||
    point.y < placement.y ||
    point.y > placement.y + imageSize.height
  ) {
    return
  }
  dragState.value = {
    pointerId: event.pointerId,
    startX: point.x,
    startY: point.y,
    imageX: placement.x,
    imageY: placement.y,
  }
  previewCanvas.value?.setPointerCapture(event.pointerId)
}

const handlePreviewPointerMove = (event: PointerEvent) => {
  const state = dragState.value
  if (!state || state.pointerId !== event.pointerId) return
  const point = getPreviewPoint(event)
  imagePosition.value = {
    ...clampImagePosition({
      x: state.imageX + point.x - state.startX,
      y: state.imageY + point.y - state.startY,
    }),
  }
}

const handlePreviewPointerUp = (event: PointerEvent) => {
  if (dragState.value?.pointerId !== event.pointerId) return
  if (previewCanvas.value?.hasPointerCapture(event.pointerId)) {
    previewCanvas.value.releasePointerCapture(event.pointerId)
  }
  dragState.value = undefined
}

const render = async () => {
  if (!sourceFile.value || !sourceImage.value || !width.value || !height.value) {
    ElMessage.warning('请先选择图片并设置有效的分辨率')
    return
  }
  if (isCanvasTooLarge.value) {
    ElMessage.warning(`输出像素过大，请将宽高乘积控制在 ${MAX_CANVAS_PIXELS.toLocaleString()} 以内`)
    return
  }

  processing.value = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width.value)
    canvas.height = Math.round(height.value)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器不支持画布导出')

    if (outputType.value === 'image/jpeg') {
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    if (props.mode === 'canvas') {
      const imageSize = getCanvasImageSize()
      const placement = getImagePlacement()
      context.drawImage(
        sourceImage.value,
        placement.x,
        placement.y,
        imageSize.width,
        imageSize.height,
      )
    } else {
      context.drawImage(sourceImage.value, 0, 0, canvas.width, canvas.height)
    }

    const blob = await canvasToBlob(canvas, outputType.value, quality.value / 100)
    downloadBlob(blob, replaceExtension(sourceFile.value.name, outputType.value))
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '图片处理失败')
  } finally {
    processing.value = false
  }
}

onBeforeUnmount(() => {
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
})
</script>

<template>
  <div class="resolution-tool">
    <div class="heading">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <div v-if="!sourceImage" class="upload-section">
      <el-upload
        class="upload-drop-zone"
        drag
        :auto-upload="false"
        accept="image/*,.heic,.heif"
        :show-file-list="false"
        :on-change="handleFileChange"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">
          <h3>将图片拖到此处，或点击上传</h3>
          <p>支持 JPG、PNG、WEBP 等图片格式</p>
        </div>
      </el-upload>
    </div>

    <template v-else>
      <div class="preview-card">
        <div
          class="preview-stage"
          :class="{
            draggable: mode === 'canvas' && canvasAlignment === 'custom',
          }"
        >
          <img
            v-if="showOriginalPreview"
            class="original-preview"
            :src="sourceUrl"
            :alt="`${title}原图预览`"
          />
          <canvas
            v-else
            ref="previewCanvas"
            :aria-label="`${title}预览`"
            @pointerdown="handlePreviewPointerDown"
            @pointermove="handlePreviewPointerMove"
            @pointerup="handlePreviewPointerUp"
            @pointercancel="handlePreviewPointerUp"
          />
        </div>
        <div class="preview-meta">
          <strong>{{ sourceFile?.name }}</strong>
          <span>原始尺寸：{{ sourceImage.naturalWidth }} × {{ sourceImage.naturalHeight }}</span>
          <span>输出尺寸：{{ width }} × {{ height }}</span>
          <span>预览缩放：{{ previewScaleLabel }}</span>
          <span v-if="mode === 'canvas'">当前对齐：{{ currentAlignmentLabel }}</span>
          <span v-if="jpegTransparencyHint" class="field-hint">
            若原图含透明像素，JPG 会将透明区域填充为白色
          </span>
        </div>
      </div>

      <div v-if="mode === 'canvas'" class="alignment-setting">
        <div class="alignment-controls">
          <div class="alignment-grid">
            <button
              v-for="option in alignmentOptions"
              :key="option.value"
              type="button"
              :class="['alignment-button', { active: canvasAlignment === option.value }]"
              :aria-label="option.label"
              @click="selectAlignment(option.value)"
            >
              <component :is="option.icon" class="alignment-icon" />
            </button>
          </div>
          <button
            type="button"
            class="custom-alignment-button"
            :class="{ active: canvasAlignment === 'custom' }"
            @click="selectAlignment('custom')"
          >
            自定义拖拽
          </button>
          <el-form-item v-if="canvasAlignment === 'custom'" label="X 坐标" class="position-input">
            <el-input-number
              v-model="imagePosition.x"
              :min="-20000"
              :max="20000"
              controls-position="right"
              @change="normalizeCustomPosition"
            />
          </el-form-item>
          <el-form-item v-if="canvasAlignment === 'custom'" label="Y 坐标" class="position-input">
            <el-input-number
              v-model="imagePosition.y"
              :min="-20000"
              :max="20000"
              controls-position="right"
              @change="normalizeCustomPosition"
            />
          </el-form-item>
        </div>
        <button
          type="button"
          class="canvas-bounds-button"
          :class="{ active: constrainImageToCanvas }"
          :aria-pressed="constrainImageToCanvas"
          :disabled="imageWidth > width || imageHeight > height"
          @click="toggleCanvasBounds(!constrainImageToCanvas)"
        >
          将图片锁定在画布内
        </button>
      </div>

      <el-form class="settings" label-position="top">
        <div v-if="mode === 'image'" class="dimensions-row">
          <el-form-item label="目标宽度">
            <el-input-number
              v-model="width"
              :min="1"
              :max="20000"
              controls-position="right"
              @input="handleDimensionChange('width', $event)"
              @change="handleDimensionChange('width', $event)"
            />
          </el-form-item>
          <AspectRatioToggle
            :model-value="aspectRatioLocked"
            @update:model-value="toggleAspectRatio"
          />
          <el-form-item label="目标高度">
            <el-input-number
              v-model="height"
              :min="1"
              :max="20000"
              controls-position="right"
              @input="handleDimensionChange('height', $event)"
              @change="handleDimensionChange('height', $event)"
            />
          </el-form-item>
        </div>
        <template v-if="mode === 'canvas'">
          <div class="dimensions-row">
            <el-form-item label="画布宽度">
              <el-input-number
                v-model="width"
                :min="1"
                :max="20000"
                controls-position="right"
                @input="handleDimensionChange('width', $event)"
                @change="handleDimensionChange('width', $event)"
              />
            </el-form-item>
            <AspectRatioToggle
              :model-value="aspectRatioLocked"
              label="画布宽高比例"
              @update:model-value="toggleAspectRatio"
            />
            <el-form-item label="画布高度">
              <el-input-number
                v-model="height"
                :min="1"
                :max="20000"
                controls-position="right"
                @input="handleDimensionChange('height', $event)"
                @change="handleDimensionChange('height', $event)"
              />
            </el-form-item>
          </div>
          <div class="dimensions-row">
            <el-form-item label="图片宽度">
              <el-input-number
                v-model="imageWidth"
                :min="1"
                :max="20000"
                controls-position="right"
                @input="handleImageDimensionChange('width', $event)"
                @change="handleImageDimensionChange('width', $event)"
              />
            </el-form-item>
            <AspectRatioToggle
              :model-value="imageAspectRatioLocked"
              label="图片宽高比例"
              @update:model-value="toggleImageAspectRatio"
            />
            <el-form-item label="图片高度">
              <el-input-number
                v-model="imageHeight"
                :min="1"
                :max="20000"
                controls-position="right"
                @input="handleImageDimensionChange('height', $event)"
                @change="handleImageDimensionChange('height', $event)"
              />
            </el-form-item>
          </div>
        </template>
        <el-form-item :label="`压缩质量（${quality}%）`">
          <el-slider v-model="quality" :min="1" :max="100" :disabled="qualityDisabled" />
          <small v-if="qualityDisabled" class="field-hint">PNG 输出不使用质量参数</small>
        </el-form-item>
        <el-form-item label="输出格式">
          <el-select v-model="outputType">
            <el-option
              v-for="type in imageOutputTypes"
              :key="type"
              :label="type.split('/')[1].toUpperCase()"
              :value="type"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="actions">
        <el-button @click="showOriginalPreview = !showOriginalPreview">
          {{ showOriginalPreview ? '查看处理预览' : '查看原图' }}
        </el-button>
        <el-button type="primary" :loading="processing" @click="render">
          导出 {{ outputLabel }}
        </el-button>
        <el-button :disabled="processing" @click="reset">重新选择</el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.resolution-tool {
  width: min(100% - 40px, 1120px);
  max-width: 1200px;
  margin: 0 auto 48px;
}
.heading {
  margin: 32px 0 24px;
  text-align: center;
}
.heading h2 {
  margin: 0 0 8px;
  font-size: 24px;
}
.heading p {
  margin: 0;
  color: #909399;
}
.upload-section {
  padding: 28px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}
.upload-drop-zone {
  border: 2px dashed #e5e5e5;
  padding: 48px 16px;
  border-radius: 10px;
}
.upload-icon {
  font-size: 3rem;
  color: #909399;
  margin-bottom: 1rem;
}
.upload-text h3 {
  margin-bottom: 0.5rem;
  color: #303133;
}
.upload-text p {
  color: #909399;
}
.preview-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  align-items: center;
  gap: 24px;
  min-height: 260px;
  padding: 24px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
}
.preview-card img {
  max-width: 360px;
  max-height: 300px;
  object-fit: contain;
}
.preview-stage {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  width: fit-content;
  max-width: 760px;
  min-width: 0;
  overflow: auto;
  background-color: #f0f2f5;
  background-image:
    linear-gradient(45deg, #e4e7ed 25%, transparent 25%),
    linear-gradient(-45deg, #e4e7ed 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e4e7ed 75%),
    linear-gradient(-45deg, transparent 75%, #e4e7ed 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0;
}
.preview-stage canvas {
  display: block;
  max-width: 100%;
  height: auto;
}
.preview-stage .original-preview {
  display: block;
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
}
.preview-stage.draggable canvas {
  cursor: grab;
}
.preview-stage.draggable canvas:active {
  cursor: grabbing;
}
.alignment-setting {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 16px;
  margin-top: 18px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}
.alignment-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.canvas-bounds-button {
  margin-left: auto;
  min-height: 30px;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  cursor: pointer;
}
.canvas-bounds-button:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.canvas-bounds-button.active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.canvas-bounds-button:disabled {
  color: var(--el-text-color-disabled);
  background: var(--el-fill-color-light);
  cursor: not-allowed;
}
.alignment-grid {
  display: grid;
  grid-template-columns: repeat(3, 28px);
  gap: 4px;
}
.alignment-grid button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}
.alignment-icon {
  display: block;
  width: 16px;
  height: 16px;
}
.alignment-grid button.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.alignment-grid button.active .alignment-icon {
  color: var(--el-color-primary);
}
.custom-alignment-button {
  padding: 4px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  color: #606266;
  background: #fff;
  cursor: pointer;
}
.custom-alignment-button.active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-wrap: anywhere;
}
.preview-meta span {
  color: #909399;
}
.settings {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px 40px;
  margin-top: 20px;
  padding: 20px 24px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}
.settings :deep(.el-input-number),
.settings :deep(.el-select) {
  width: 100%;
}
.dimensions-row {
  position: relative;
  display: grid;
  grid-column: span 2;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 40px;
  align-self: start;
  margin-bottom: 18px;
}
.dimensions-row :deep(.el-form-item) {
  min-width: 0;
  margin-bottom: 0;
}
.position-input {
  width: 160px;
  margin: 0;
}
.position-input :deep(.el-input-number) {
  width: 100%;
}
.field-hint {
  color: #909399;
  font-size: 12px;
}
.actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
@media (max-width: 760px) {
  .resolution-tool {
    width: min(100% - 24px, 1120px);
  }
  .settings {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .dimensions-row {
    grid-column: 1 / -1;
  }
  .preview-card {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    padding: 16px;
  }
  .preview-meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 12px;
  }
  .preview-meta strong { grid-column: 1 / -1; }
  .alignment-setting {
    gap: 10px 12px;
    padding: 14px;
  }
  .settings {
    padding: 16px 14px 4px;
  }
}
@media (max-width: 420px) {
  .settings {
    grid-template-columns: minmax(0, 1fr);
  }
  .dimensions-row {
    grid-column: span 1;
    column-gap: 40px;
  }
  .preview-meta {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

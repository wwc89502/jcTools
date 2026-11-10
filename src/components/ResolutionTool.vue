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
import {
  canvasToBlob,
  downloadBlob,
  imageOutputTypes,
  loadImage,
  replaceExtension,
  type ImageOutputType,
} from '@/utils/image-export'

const props = defineProps<{ mode: 'canvas' | 'image' }>()

const sourceFile = ref<File>()
const sourceImage = ref<HTMLImageElement>()
const sourceUrl = ref('')
const width = ref(0)
const height = ref(0)
const quality = ref(90)
const outputType = ref<ImageOutputType>('image/jpeg')
const processing = ref(false)
const previewCanvas = ref<HTMLCanvasElement>()
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
const currentAlignmentLabel = computed(() =>
  canvasAlignment.value === 'custom'
    ? '自定义拖拽'
    : alignmentOptions.find((option) => option.value === canvasAlignment.value)?.label,
)

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

const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw as File | undefined
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  try {
    const loaded = await loadImage(file)
    if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
    sourceFile.value = loaded.file
    sourceImage.value = loaded.image
    sourceUrl.value = loaded.url
    width.value = loaded.image.naturalWidth
    height.value = loaded.image.naturalHeight
    imageWidth.value = loaded.image.naturalWidth
    imageHeight.value = loaded.image.naturalHeight
    canvasAlignment.value = 'center'
    syncAlignmentPosition()
    drawPreview()
  } catch (error: any) {
    ElMessage.error(error.message || '图片加载失败')
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
}

watch(
  [sourceImage, width, height, imageWidth, imageHeight, canvasAlignment, outputType],
  () => {
    syncAlignmentPosition()
    drawPreview()
  },
  { flush: 'post' },
)
watch(imagePosition, () => drawPreview(), { deep: true, flush: 'post' })

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
    x: state.imageX + point.x - state.startX,
    y: state.imageY + point.y - state.startY,
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
  } catch (error: any) {
    ElMessage.error(error.message || '图片处理失败')
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
        accept="image/*"
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
          :class="{ draggable: mode === 'canvas' && canvasAlignment === 'custom' }"
        >
          <canvas
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
        </div>
      </div>

      <div v-if="mode === 'canvas'" class="alignment-setting">
        <span class="setting-label">原图对齐</span>
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
        <span class="alignment-name">
          {{ currentAlignmentLabel }}
        </span>
        <button
          type="button"
          class="custom-alignment-button"
          :class="{ active: canvasAlignment === 'custom' }"
          @click="selectAlignment('custom')"
        >
          自定义拖拽
        </button>
      </div>

      <el-form class="settings" label-position="top">
        <el-form-item label="目标宽度">
          <el-input-number v-model="width" :min="1" :max="20000" controls-position="right" />
        </el-form-item>
        <el-form-item label="目标高度">
          <el-input-number v-model="height" :min="1" :max="20000" controls-position="right" />
        </el-form-item>
        <template v-if="mode === 'canvas'">
          <el-form-item label="图片宽度">
            <el-input-number
              v-model="imageWidth"
              :min="1"
              :max="20000"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="图片高度">
            <el-input-number
              v-model="imageHeight"
              :min="1"
              :max="20000"
              controls-position="right"
            />
          </el-form-item>
        </template>
        <el-form-item :label="`压缩质量（${quality}%）`">
          <el-slider v-model="quality" :min="1" :max="100" />
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
  width: 90%;
  max-width: 1200px;
  margin: 0 auto 40px;
}
.heading {
  margin: 28px 0 20px;
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
  padding: 2rem;
}
.upload-drop-zone {
  border: 2px dashed #e5e5e5;
  padding: 3rem 1rem;
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
  display: flex;
  align-items: center;
  gap: 20px;
  min-height: 220px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}
.preview-card img {
  max-width: 360px;
  max-height: 300px;
  object-fit: contain;
}
.preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 720px;
  min-width: 0;
  min-height: 120px;
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
.preview-stage.draggable canvas {
  cursor: grab;
}
.preview-stage.draggable canvas:active {
  cursor: grabbing;
}
.alignment-setting {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
}
.setting-label {
  flex: 0 0 auto;
  color: #606266;
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
.alignment-name {
  color: #909399;
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
  gap: 16px;
  margin-top: 24px;
}
.settings :deep(.el-input-number),
.settings :deep(.el-select) {
  width: 100%;
}
.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}
@media (max-width: 760px) {
  .settings {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .preview-card {
    align-items: flex-start;
    flex-direction: column;
  }
  .preview-card img {
    max-width: 100%;
  }
  .alignment-setting {
    align-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>

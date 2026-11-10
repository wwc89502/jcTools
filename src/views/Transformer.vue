<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'
import { isSupportedImageFile, loadImage } from '@/utils/image-export'

interface CompressionSettings {
  quality: number
  fileType: string
}

interface UploadChangeFile {
  raw?: File
}

const compressionSettings = ref<CompressionSettings>({
  quality: 90,
  fileType: '',
})

const typeList = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BATCH_IMAGE_PIXELS = 40_000_000
const hasShownGifNotice = ref(false)

type FileStatus = 'pending' | 'compressing' | 'done' | 'error'
interface BatchFileItem {
  id: number
  name: string
  size: number
  type: string
  file: File
  selected: boolean
  status: FileStatus
  compressedBlob: Blob | null
  compressedSize: number | null
  errorMessage: string
}

// 通用压缩图片函数
const compressImage = async (file: File): Promise<Blob> => {
  const loaded = await loadImage(file)
  try {
    if (loaded.image.naturalWidth * loaded.image.naturalHeight > MAX_BATCH_IMAGE_PIXELS) {
      throw new Error(`图片像素过大，单张图片请控制在 ${MAX_BATCH_IMAGE_PIXELS.toLocaleString()} 像素以内`)
    }
    const canvas = document.createElement('canvas')
    canvas.width = loaded.image.naturalWidth
    canvas.height = loaded.image.naturalHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器不支持图片处理')

    const outputType = compressionSettings.value.fileType || file.type || 'image/png'
    if (outputType === 'image/jpeg') {
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    context.drawImage(loaded.image, 0, 0)
    const requestedType = compressionSettings.value.fileType
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片导出失败'))
          } else if (requestedType && blob.type !== requestedType) {
            reject(new Error(`当前浏览器无法输出 ${requestedType.split('/')[1].toUpperCase()} 格式`))
          } else {
            resolve(blob)
          }
        },
        outputType,
        compressionSettings.value.quality / 100,
      )
    })
  } finally {
    URL.revokeObjectURL(loaded.url)
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// 批量压缩状态变量
const files = ref<BatchFileItem[]>([])
const compressing = ref(false)
const downloadingAll = ref(false)
const zipProgress = ref(0)
const compressProgress = ref(0)
const currentFileName = ref('')
const currentFileIndex = ref(0)
const processingTotal = ref(0)
const selectableFiles = computed(() => files.value.filter((file) => file.compressedBlob))
const selectedFiles = computed(() =>
  files.value.filter((file) => file.selected && file.compressedBlob),
)
const allSelected = computed(
  () => selectableFiles.value.length > 0 && selectedFiles.value.length === selectableFiles.value.length,
)
const selectionIndeterminate = computed(
  () => selectedFiles.value.length > 0 && selectedFiles.value.length < selectableFiles.value.length,
)

watch(
  () => [compressionSettings.value.quality, compressionSettings.value.fileType],
  () => {
    if (compressing.value) return
    files.value.forEach((file) => {
      if (!file.compressedBlob && file.status !== 'error') return
      file.compressedBlob = null
      file.compressedSize = null
      file.errorMessage = ''
      file.status = 'pending'
    })
  },
)

const toggleSelectAll = (value: boolean | string | number) => {
  const selected = Boolean(value)
  selectableFiles.value.forEach((file) => {
    file.selected = selected
  })
}

const getOutputFilename = (file: BatchFileItem) => {
  const extension = file.compressedBlob?.type?.split('/')[1] || file.type.split('/')[1]
  const normalizedExtension = extension === 'jpeg' ? 'jpg' : extension
  return file.name.replace(/\.[^/.]+$/, '') + `.${normalizedExtension}`
}

const getUniqueFilename = (filename: string, usedNames: Set<string>) => {
  if (!usedNames.has(filename)) {
    usedNames.add(filename)
    return filename
  }

  const extensionIndex = filename.lastIndexOf('.')
  const base = extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename
  const extension = extensionIndex > 0 ? filename.slice(extensionIndex) : ''
  let index = 2
  let candidate = `${base} (${index})${extension}`
  while (usedNames.has(candidate)) {
    index += 1
    candidate = `${base} (${index})${extension}`
  }
  usedNames.add(candidate)
  return candidate
}

// 处理批量文件上传
const handleFilesChange = (file: UploadChangeFile) => {
  const fileObj = file.raw
  if (!fileObj) return

  // 验证文件类型
  if (!isSupportedImageFile(fileObj)) {
    ElMessage.error('请选择图片文件')
    return
  }

  if (
    (fileObj.type === 'image/gif' || /\.gif$/i.test(fileObj.name)) &&
    !hasShownGifNotice.value
  ) {
    hasShownGifNotice.value = true
    ElMessage.warning('GIF 动图会按首帧处理，导出后不保留动画')
  }

  const duplicate = files.value.some(
    (item) =>
      item.name === fileObj.name &&
      item.size === fileObj.size &&
      item.file.lastModified === fileObj.lastModified,
  )
  if (duplicate) {
    ElMessage.warning(`文件已在列表中：${fileObj.name}`)
    return
  }

  // 添加到文件列表
  files.value.push({
    id: Date.now() + Math.random(),
    name: fileObj.name,
    size: fileObj.size,
    type: fileObj.type,
    file: fileObj,
    selected: true,
    status: 'pending', // pending, compressing, done, error
    compressedBlob: null,
    compressedSize: null,
    errorMessage: '',
  })
}

const compressFile = async (file: BatchFileItem, index?: number, total?: number) => {
  file.status = 'compressing'
  file.compressedBlob = null
  file.compressedSize = null
  file.errorMessage = ''
  currentFileName.value = file.name
  if (index !== undefined) currentFileIndex.value = index
  if (total !== undefined) processingTotal.value = total
  try {
    const compressedBlob = await compressImage(file.file)
    file.compressedBlob = compressedBlob
    file.compressedSize = compressedBlob.size
    file.status = 'done'
  } catch (error: unknown) {
    file.status = 'error'
    file.errorMessage = error instanceof Error ? error.message : '未知错误'
    ElMessage.error(`${file.name}：${file.errorMessage}`)
  }
}

const removeFile = (file: BatchFileItem) => {
  if (compressing.value) return
  files.value = files.value.filter((item) => item.id !== file.id)
}

const retryFile = async (file: BatchFileItem) => {
  if (compressing.value || !file.file) return
  compressing.value = true
  try {
    await compressFile(file)
  } finally {
    currentFileName.value = ''
    currentFileIndex.value = 0
    processingTotal.value = 0
    compressing.value = false
  }
}

// 压缩所有图片
const compressAll = async () => {
  if (compressing.value) return
  compressing.value = true
  compressProgress.value = 0

  try {
    const total = files.value.length
    for (const [index, file] of files.value.entries()) {
      await compressFile(file, index + 1, total)
      compressProgress.value = Math.round(((index + 1) / files.value.length) * 100)
    }
  } finally {
    currentFileName.value = ''
    currentFileIndex.value = 0
    processingTotal.value = 0
    compressing.value = false
  }
}

// 下载单个文件
const downloadSingle = (file: BatchFileItem) => {
  if (!file.compressedBlob) return

  const url = URL.createObjectURL(file.compressedBlob)
  const link = document.createElement('a')
  link.download = getOutputFilename(file)
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

// 下载所有文件
const downloadAll = async () => {
  const readyFiles = selectedFiles.value
  if (!readyFiles.length || downloadingAll.value) return

  downloadingAll.value = true
  zipProgress.value = 0
  try {
    const zip = new JSZip()
    const usedNames = new Set<string>()
    readyFiles.forEach((file) => {
      if (!file.compressedBlob) return
      zip.file(getUniqueFilename(getOutputFilename(file), usedNames), file.compressedBlob)
    })
    const blob = await zip.generateAsync(
      { type: 'blob' },
      (metadata) => {
        zipProgress.value = Math.round(metadata.percent)
      },
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = '图片转换结果.zip'
    link.href = url
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch {
    ElMessage.error('压缩包生成失败')
  } finally {
    zipProgress.value = 0
    downloadingAll.value = false
  }
}

// 重置批量文件
const resetFiles = () => {
  files.value = []
  hasShownGifNotice.value = false
}

// 获取状态文本
const getStatusText = (status: FileStatus) => {
  const statusMap: Record<FileStatus, string> = {
    pending: '待处理',
    compressing: '压缩中',
    done: '已完成',
    error: '失败',
  }
  return statusMap[status]
}

// 获取状态类型
const getStatusType = (status: FileStatus) => {
  const typeMap: Record<FileStatus, 'info' | 'warning' | 'success' | 'danger'> = {
    pending: 'info',
    compressing: 'warning',
    done: 'success',
    error: 'danger',
  }
  return typeMap[status]
}
</script>

<template>
  <div class="transformer">
    <div class="upload-section" v-if="!files.length">
      <el-upload
        class="upload-drop-zone"
        drag
        multiple
        :auto-upload="false"
        accept="image/*,.heic,.heif"
        :show-file-list="false"
        @change="handleFilesChange"
      >
        <el-icon class="upload-icon">
          <upload-filled />
        </el-icon>
        <div class="upload-text">
          <h3>将多张图片拖到此处，或点击上传</h3>
          <p>支持浏览器可读取的图片格式，输出为 JPG/PNG/WEBP</p>
        </div>
      </el-upload>
    </div>

    <!-- 批量压缩文件列表和控制区域 -->
    <div v-else class="compress-section">
      <!-- 压缩设置 -->
      <div class="compression-controls">
        <el-form :model="compressionSettings" label-position="top">
          <el-form-item :label="`压缩质量 (${compressionSettings.quality}%)`">
            <el-slider
              v-model="compressionSettings.quality"
              :min="1"
              :max="100"
              :disabled="compressing"
            />
          </el-form-item>
        </el-form>

        <div class="action-buttons">
          <el-select
            v-model="compressionSettings.fileType"
            placeholder="同时转换格式"
            :disabled="compressing"
          >
            <el-option
              v-for="(item, index) in typeList"
              :key="index"
              :label="item"
              :value="item"
            ></el-option>
          </el-select>
          <el-button type="primary" @click="compressAll" :loading="compressing">
            {{ compressing ? `压缩中 ${compressProgress}%` : '开始压缩' }}
          </el-button>
          <span v-if="compressing && currentFileName" class="progress-name">
            正在处理 {{ currentFileIndex }}/{{ processingTotal }}：{{ currentFileName }}
          </span>
          <el-button :disabled="compressing" @click="resetFiles">重新选择</el-button>
          <el-button
            type="success"
            @click="downloadAll"
            :loading="downloadingAll"
            :disabled="!selectedFiles.length || compressing"
          >
            {{ downloadingAll ? `打包中 ${zipProgress}%` : '打包下载' }}
          </el-button>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="files-list">
        <el-table :data="files" style="width: 100%">
          <el-table-column width="70" align="center">
            <template #header>
              <el-checkbox
                :model-value="allSelected"
                :indeterminate="selectionIndeterminate"
                :disabled="!selectableFiles.length"
                @change="toggleSelectAll"
              />
            </template>
            <template #default="{ row }">
              <el-checkbox v-model="row.selected" :disabled="!row.compressedBlob" />
            </template>
          </el-table-column>
          <el-table-column label="文件名" prop="name" />
          <el-table-column label="原始大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="压缩后大小" width="120">
            <template #default="{ row }">
              {{ row.compressedSize ? formatFileSize(row.compressedSize) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="压缩率" width="120">
            <template #default="{ row }">
              {{
                row.compressedSize
                  ? Math.round((1 - row.compressedSize / row.size) * 100).toString() + '%'
                  : '-'
              }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" :title="row.errorMessage || undefined">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="row.status === 'error' ? retryFile(row) : downloadSingle(row)"
                :disabled="compressing || (row.status !== 'error' && !row.compressedBlob)"
              >
                {{ row.status === 'error' ? '重试' : '下载' }}
              </el-button>
              <el-button link type="danger" :disabled="compressing" @click="removeFile(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transformer {
  width: min(100% - 40px, 1200px);
  max-width: 1200px;
  margin: 0 auto 48px;
}

.upload-section {
  padding: 2rem;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.upload-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.upload-drop-zone {
  border: 2px dashed #e5e5e5;
  padding: 3rem 1rem;
  transition: all 0.3s ease;
}

.upload-drop-zone:hover {
  border-color: var(--el-color-primary);
  background: rgba(64, 158, 255, 0.04);
}

.upload-icon {
  font-size: 3rem;
  color: #909399;
  margin-bottom: 1rem;
}

.upload-text h3 {
  font-size: 1.2rem;
  color: #303133;
  margin-bottom: 0.5rem;
}

.upload-text p {
  color: #909399;
}

.compression-controls {
  max-width: 760px;
  margin: 2rem auto 0;
  padding: 24px 28px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: rgba(245, 245, 247, 0.6);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
.progress-name {
  align-self: center;
  color: #909399;
  font-size: 13px;
}

.files-list {
  margin-top: 2rem;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}

@media (max-width: 760px) {
  .transformer {
    width: min(100% - 24px, 1200px);
  }
  .files-list {
    overflow-x: auto;
  }
  .files-list :deep(.el-table) {
    min-width: 850px;
  }
}

@media (max-width: 640px) {
  .compression-controls {
    padding: 1.25rem;
  }

  .action-buttons {
    align-items: stretch;
    flex-direction: column;
  }

  .action-buttons .el-button,
  .action-buttons .el-select {
    width: 100%;
  }
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'

const compressionSettings = ref<any>({
  quality: 90,
  fileType: '',
})

const typeList = ['image/jpeg', 'image/png', 'image/webp']

// 通用压缩图片函数
const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('当前浏览器不支持图片处理'))
        return
      }
      const fileType = compressionSettings.value.fileType || file.type
      if (fileType === 'image/jpeg') {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('压缩失败'))
          }
          URL.revokeObjectURL(url)
        },
        fileType,
        compressionSettings.value.quality / 100,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })
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
const files = ref<any[]>([])
const compressing = ref(false)
const downloadingAll = ref(false)
const compressProgress = ref(0)
const selectableFiles = computed(() => files.value.filter((file: any) => file.compressedBlob))
const selectedFiles = computed(() =>
  files.value.filter((file: any) => file.selected && file.compressedBlob),
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
    files.value.forEach((file: any) => {
      if (!file.compressedBlob) return
      file.compressedBlob = null
      file.compressedSize = null
      file.status = 'pending'
    })
  },
)

const toggleSelectAll = (value: boolean | string | number) => {
  const selected = Boolean(value)
  selectableFiles.value.forEach((file: any) => {
    file.selected = selected
  })
}

const getOutputFilename = (file: any) => {
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
const handleFilesChange = (file: any) => {
  const fileObj = file.raw
  if (!fileObj) return

  // 验证文件类型
  if (!typeList.includes(fileObj.type)) {
    ElMessage.error('只支持 JPG/PNG/WEBP 格式的图片')
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
  })
}

// 压缩所有图片
const compressAll = async () => {
  if (compressing.value) return
  compressing.value = true
  compressProgress.value = 0

  try {
    for (const [index, file] of files.value.entries()) {
      file.status = 'compressing'
      file.compressedBlob = null
      file.compressedSize = null
      try {
        const compressedBlob: any = await compressImage(file.file)
        file.compressedBlob = compressedBlob
        file.compressedSize = compressedBlob.size
        file.status = 'done'
      } catch (err) {
        file.status = 'error'
        ElMessage.error(`压缩失败: ${file.name}`)
      }
      compressProgress.value = Math.round(((index + 1) / files.value.length) * 100)
    }
  } finally {
    compressing.value = false
  }
}

// 下载单个文件
const downloadSingle = (file: any) => {
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
  try {
    const zip = new JSZip()
    const usedNames = new Set<string>()
    readyFiles.forEach((file: any) => {
      zip.file(getUniqueFilename(getOutputFilename(file), usedNames), file.compressedBlob)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = '图片转换结果.zip'
    link.href = url
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch {
    ElMessage.error('压缩包生成失败')
  } finally {
    downloadingAll.value = false
  }
}

// 重置批量文件
const resetFiles = () => {
  files.value = []
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: any = {
    pending: '待处理',
    compressing: '压缩中',
    done: '已完成',
    error: '失败',
  }
  return statusMap[status]
}

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: any = {
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
        accept="image/*"
        :show-file-list="false"
        @change="handleFilesChange"
      >
        <el-icon class="upload-icon">
          <upload-filled />
        </el-icon>
        <div class="upload-text">
          <h3>将多张图片拖到此处，或点击上传</h3>
          <p>支持 PNG/JPG/WEBP 格式</p>
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
          <el-button type="primary" @click="compressAll" :loading="compressing">
            {{ compressing ? `压缩中 ${compressProgress}%` : '开始压缩' }}
          </el-button>
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
          <el-button :disabled="compressing" @click="resetFiles">重新选择</el-button>
          <el-button
            type="success"
            @click="downloadAll"
            :loading="downloadingAll"
            :disabled="!selectedFiles.length || compressing"
          >
            打包下载
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
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="downloadSingle(row)"
                :disabled="!row.compressedBlob"
              >
                下载
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
  width: 90%;
  max-width: 1200px;
  margin: 0 auto 40px;
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
  max-width: 540px;
  margin: 2rem auto 0;
  padding: 2rem;
  background: rgba(245, 245, 247, 0.6);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.files-list {
  margin-top: 2rem;
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

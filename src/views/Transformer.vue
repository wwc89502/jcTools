<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const compressionSettings = ref<any>({
  quality: 90,
  fileType: '',
})

const typeList = ['image/jpeg', 'image/png', 'image/webp']

// 通用压缩图片函数
const compressImage = (file: any) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx: any = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const fileType = compressionSettings.value.fileType || file.type
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('压缩失败'))
          }
        },
        fileType,
        compressionSettings.value.quality / 100,
      )
    }

    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
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
    status: 'pending', // pending, compressing, done, error
    compressedBlob: null,
    compressedSize: null,
  })
}

// 压缩所有图片
const compressAll = async () => {
  if (compressing.value) return
  compressing.value = true

  try {
    for (const file of files.value) {
      // if (file.status === 'done') continue

      file.status = 'compressing'
      try {
        const compressedBlob: any = await compressImage(file.file)
        file.compressedBlob = compressedBlob
        file.compressedSize = compressedBlob.size
        file.status = 'done'
      } catch (err) {
        file.status = 'error'
        ElMessage.error(`压缩失败: ${file.name}`)
      }
    }
  } finally {
    compressing.value = false
  }
}

// 下载单个文件
const downloadSingle = (file: any) => {
  if (!file.compressedBlob) return

  const link = document.createElement('a')
  let filename = file.name
  let newFilename = filename.replace(
    /\.(jpg|jpeg|png|webp)$/i,
    `.${file.compressedBlob.type.split('/')[1]}`,
  )
  link.download = `compressed_${newFilename}`
  link.href = URL.createObjectURL(file.compressedBlob)
  link.click()
}

// 下载所有文件
const downloadAll = () => {
  files.value.filter((file: any) => file.compressedBlob).forEach((file) => downloadSingle(file))
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
            <el-slider v-model="compressionSettings.quality" :min="1" :max="100" />
          </el-form-item>
        </el-form>

        <div class="action-buttons">
          <el-button type="primary" @click="compressAll" :loading="compressing">
            开始压缩
          </el-button>
          <el-select v-model="compressionSettings.fileType" placeholder="同时转换格式">
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
            :disabled="!files.some((f) => f.compressedBlob)"
          >
            下载全部
          </el-button>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="files-list">
        <el-table :data="files" style="width: 100%">
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
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.files-list {
  margin-top: 2rem;
}
</style>

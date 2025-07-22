<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const option = ref({
  img: '',
  outputSize: 90,
  autoCropWidth: 10,
  autoCropHeight: 10,
  enlarge: 1,
  outputType: '',
  info: true,
  canScale: true,
  autoCrop: true,
  full: false,
  infoTrue: false,
  mode: 'contain',
  original: false,
  maxImgSize: '10000',
})
const typeList = ['jpeg', 'png', 'webp']
const crop = ref()
const cropper = ref()
const fileName = ref('')

const getImageUrl = (file: any) => {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        url: URL.createObjectURL(file),
        height: img.height,
        width: img.width,
        outputType: file.type.split('/')[1],
        fileName: file.name,
      })
    }

    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}

// 处理批量文件上传
const handleFilesChange = async (file: any) => {
  const fileObj = file.raw
  if (!fileObj) return

  // 验证文件类型
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(fileObj.type)) {
    ElMessage.error('只支持 JPG/PNG/WEBP 格式的图片')
    return
  }

  option.value.img = ''
  option.value.outputType = ''
  fileName.value = ''
  const img: any = await getImageUrl(fileObj)
  option.value.img = img.url
  option.value.outputType = img.outputType
  fileName.value = img.fileName
  let enlarge = 0
  if (crop.value.offsetHeight / crop.value.offsetWidth > img.height / img.width) {
    enlarge = crop.value.offsetWidth / img.width
  } else {
    enlarge = crop.value.offsetHeight / img.height
  }
  if (enlarge > 1) enlarge = 1
  option.value.enlarge = 1 / enlarge
  option.value.autoCropWidth = img.width * enlarge
  option.value.autoCropHeight = img.height * enlarge
}
const saveImage = () => {
  cropper.value.getCropBlob((data: Blob) => {
    const link = document.createElement('a')
    let newFilename = fileName.value.replace(
      /\.(jpg|jpeg|png|webp)$/i,
      `.${option.value.outputType}`,
    )
    link.download = `new_${newFilename}`
    link.href = URL.createObjectURL(data)
    link.click()
  })
}
const realTime = (e: any) => {
}
</script>

<template>
  <div class="cropper">
    <div class="crop" ref="crop">
      <vueCropper
        ref="cropper"
        v-bind="option"
        :outputSize="option.outputSize / 100"
        @realTime="realTime"
      ></vueCropper>
    </div>
    <el-form inline>
      <el-form-item label="宽高">
        <div style="display: flex; align-items: center; justify-content: center">
          <el-input-number
            style="width: 100px"
            :disabled="!option.img"
            controls-position="right"
            v-model="option.autoCropWidth"
          ></el-input-number>
          ×
          <el-input-number
            style="width: 100px"
            :disabled="!option.img"
            controls-position="right"
            v-model="option.autoCropHeight"
          ></el-input-number>
        </div>
      </el-form-item>
      <el-form-item label="输出比例倍数">
        <el-input-number
          style="width: 100px"
          :disabled="!option.img"
          controls-position="right"
          v-model="option.enlarge"
        ></el-input-number>
      </el-form-item>
      <el-form-item :label="`压缩质量 (${option.outputSize}%)`">
        <el-slider
          style="width: 160px"
          v-model="option.outputSize"
          :min="1"
          :max="100"
          :disabled="!option.img"
        />
      </el-form-item>
      <el-form-item label="输出格式">
        <el-select style="width: 140px" v-model="option.outputType" :disabled="!option.img">
          <el-option
            v-for="(item, index) in typeList"
            :key="index"
            :label="`image/${item}`"
            :value="item"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="">
        <el-button type="primary" @click="saveImage">保存</el-button>
      </el-form-item>
    </el-form>
    <div class="upload-section">
      <el-upload
        class="upload-drop-zone"
        drag
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
  </div>
</template>

<style scoped>
.cropper {
  max-width: 1200px;
  width: 90%;
  margin: 0 auto;
}
.crop {
  width: 100%;
  height: 600px;
  max-height: 80vh;
  margin-top: 40px;
  margin-bottom: 40px;
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
</style>

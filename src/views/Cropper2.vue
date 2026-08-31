<script setup lang="ts">
import { computed, ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { Cropper, CircleStencil, RectangleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css';
import 'vue-advanced-cropper/dist/theme.compact.css';

const imgUrl = ref('')
const lockRatio = ref(false)
const outputType = ref('')

const stencilSize = ref({
  width: 100,
  height: 100,
})
const typeList = ['jpeg', 'png', 'webp']
const crop = ref()
const cropperRef = ref()
const fileName = ref('')

const stencils = [
  { name: '矩形', api: RectangleStencil },
  { name: '圆形', api: CircleStencil },
]
const curStencilIndex = ref(0)

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

  imgUrl.value = ''
  outputType.value = ''
  fileName.value = ''
  const img: any = await getImageUrl(fileObj)
  imgUrl.value = img.url
  outputType.value = img.outputType
  fileName.value = img.fileName
}
const saveImage = () => {
  const a = cropperRef.value.getResult()
  const link = document.createElement('a')
  let newFilename = fileName.value.replace(
    /\.(jpg|jpeg|png|webp)$/i,
    `.${outputType.value}`,
  )
  console.log(a)
  link.download = `new_${newFilename}`
  // canvas.width = 500
  // canvas.height = 500
  // link.href = canvas.toDataURL()
  // link.click()
}
const change = (e: any) => {
  console.log(e)
  stencilSize.value.width = e.coordinates.width
  stencilSize.value.height = e.coordinates.height
}

const changeSize = (e, type) => {
  cropperRef.value.setCoordinates({
    [type]: e,
  })
}
</script>

<template>
  <div class="cropper">
    <div class="crop" ref="crop">
      <cropper
        v-if="imgUrl"
        ref="cropperRef"
        :src="imgUrl"
        :minWidth="10"
        :minHeight="10"
        :auto-zoom="false"
        :stencil-size="lockRatio ? stencilSize : undefined"
        :stencil-component="stencils[curStencilIndex].api"
        @change="change"
      ></cropper>
    </div>
    <el-form inline>
      <el-form-item label="宽高">
        <div style="display: flex; align-items: center; justify-content: center">
          <el-input-number
            style="width: 100px"
            :disabled="!imgUrl"
            controls-position="right"
            :min="10"
            v-model="stencilSize.width"
            @change="changeSize($event, 'width')"
          ></el-input-number>
          ×
          <el-input-number
            style="width: 100px"
            :disabled="!imgUrl"
            controls-position="right"
            :min="10"
            v-model="stencilSize.height"
            @change="changeSize($event, 'height')"
          ></el-input-number>
        </div>
      </el-form-item>
      <el-form-item label="">
        <el-checkbox v-model="lockRatio">固定尺寸</el-checkbox>
      </el-form-item>
      <el-form-item label="形状">
        <el-select style="width: 140px" v-model="curStencilIndex" :disabled="!imgUrl">
          <el-option
            v-for="(item, index) in stencils"
            :key="index"
            :label="item.name"
            :value="index"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="输出格式">
        <el-select style="width: 140px" v-model="outputType" :disabled="!imgUrl">
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

<style lang="scss" scoped>
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
  background: #000;
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

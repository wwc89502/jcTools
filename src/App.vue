<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import { InfoFilled } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const route = useRoute()
const font = ref({
  color: 'rgba(0, 0, 0, .02)',
  fontSize: 48,
  fontWeight: 'bold',
  fontFamily: 'Arial',
})

const publicMenu = ref([
  { path: '/canvas-resolution', title: '单图画布调整' },
  { path: '/image-resolution', title: '单图调整' },
  { path: '/transformer', title: '多图批量转换格式/压缩' },
])

</script>

<template>
  <el-config-provider :locale="zhCn">
  <div class="tabs">
    <el-menu router mode="horizontal" :default-active="route.path">
      <el-menu-item v-for="item in publicMenu" :index="item.path" :key="item.path">{{ item.title }}</el-menu-item>
    </el-menu>
    <div class="header-actions">
      <el-tooltip content="打开 GitHub 项目" placement="bottom">
        <a
          class="header-icon-link"
          href="https://github.com/wwc89502/jcTools"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="打开 GitHub 项目"
        >
          <svg class="github-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.05c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z"
            />
          </svg>
        </a>
      </el-tooltip>
      <el-popover placement="bottom-end" trigger="hover" :width="300">
        <template #reference>
          <button class="header-icon-button" type="button" aria-label="查看项目优势">
            <el-icon><InfoFilled /></el-icon>
          </button>
        </template>
        <div class="advantages-popover">
          <strong>项目优势</strong>
          <ul>
            <li>图片在浏览器本地处理，减少文件上传和隐私风险。</li>
            <li>支持画布尺寸、图片尺寸、质量和输出格式调整。</li>
            <li>支持多图批量转换、勾选和 ZIP 打包下载。</li>
            <li>保留原文件名，仅根据输出格式替换扩展名。</li>
            <li>画布扩展区域支持透明像素和九宫格对齐。</li>
          </ul>
        </div>
      </el-popover>
    </div>
  </div>
  <el-watermark :font="font" content="JcTools">
    <div class="layout">
      <RouterView />
    </div>
  </el-watermark>
  </el-config-provider>
</template>

<style scoped>
.tabs {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
}
.tabs :deep(.el-menu) {
  padding-right: 112px;
}
.header-actions {
  position: absolute;
  top: 0;
  right: 18px;
  display: flex;
  align-items: center;
  height: 60px;
  gap: 4px;
}
.header-icon-link,
.header-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  color: var(--el-text-color-regular);
  background: transparent;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s, background-color 0.2s;
}
.header-icon-link:hover,
.header-icon-button:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
.header-icon-link .github-icon,
.header-icon-button .el-icon {
  font-size: 20px;
}
.github-icon {
  width: 20px;
  height: 20px;
}
.advantages-popover {
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.advantages-popover strong {
  color: var(--el-text-color-primary);
}
.advantages-popover ul {
  margin: 8px 0 0;
  padding-left: 18px;
}
.layout{
  min-height: 100vh;
  padding-top: 60px;
}
@media (max-width: 760px) {
  .tabs :deep(.el-menu) {
    padding-right: 88px;
  }
  .header-actions {
    right: 8px;
  }
  .header-icon-link,
  .header-icon-button {
    width: 32px;
  }
}
</style>

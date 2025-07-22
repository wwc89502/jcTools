<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterView } from 'vue-router'

const route = useRoute()
const font = ref({
  color: 'rgba(0, 0, 0, .15)',
})
</script>

<template>
  <div class="tabs">
    <el-menu router mode="horizontal" :default-active="route.path">
      <el-menu-item index="/cropper">单图转换格式/压缩/裁剪</el-menu-item>
      <el-menu-item index="/transformer">多图批量转换格式/压缩</el-menu-item>
    </el-menu>
  </div>
  <el-watermark :font="font" content="jcTools">
    <div class="layout">
      <RouterView />
    </div>
  </el-watermark>
</template>

<style scoped>
.tabs {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
}
.layout{
  min-height: 100vh;
  padding-top: 60px;
}
</style>

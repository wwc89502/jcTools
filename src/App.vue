<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="tabs">
    <router-link to="/cropper">单图转换格式/压缩/裁剪</router-link>
    <router-link to="/transformer">批量转换格式/压缩</router-link>
  </div>
  <RouterView />
</template>

<style scoped>
.tabs {
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: #eee;
}
.tabs a {
  text-decoration: none;
  color: var(--el-color-primary);
  transition: 0.4s;
  padding: 2px 8px;
  margin: 0 4px;
  font-size: 16px;
  border-radius: 4px;
}
.tabs a.router-link-active {
  background: var(--el-color-primary);
  color: #fff;
}
</style>

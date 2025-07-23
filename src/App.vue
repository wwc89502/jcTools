<script setup lang="ts">
import { onMounted, ref } from 'vue'
import FoodsDb from '@/db/foods-db.ts'
import UserFoodsDb from '@/db/user-foods-db.ts'
import { foods, userFoods } from '@/db/dbData'
import { useGlobalStore } from '@/stores'
import { useRoute, RouterView } from 'vue-router'

const globalStore = useGlobalStore()
const route = useRoute()
const font = ref({
  color: 'rgba(0, 0, 0, .02)',
  fontSize: 48,
  fontWeight: 'bold',
  fontFamily: 'Arial',
})

const initDB = async () => {
  await FoodsDb.init(foods)
  await UserFoodsDb.init(userFoods)
}

const publicMenu = ref([
  { path: '/cropper', title: '单图转换格式/压缩/裁剪' },
  { path: '/transformer', title: '多图批量转换格式/压缩' },
])

const privateMenu = ref([
  { path: '/cll', title: '生成周食谱' },
])

const checkUser = () => {
  ElMessageBox.prompt('输入验证码', {
  }).then(({ value }) => {
    if (value === 'jc8866') {
      globalStore.setPassword(value)
    } else {
      ElMessage.error('输入有误')
    }
  })
}

onMounted(() => {
  initDB()
})
</script>

<template>
  <div class="tabs">
    <el-menu router mode="horizontal" :default-active="route.path">
      <el-menu-item v-for="item in publicMenu" :index="item.path" :key="item.path">{{ item.title }}</el-menu-item>
      <template v-if="globalStore.password === 'jc8866'">
        <el-menu-item v-for="item in privateMenu" :index="item.path" :key="item.path">{{ item.title }}</el-menu-item>
      </template>
      <el-menu-item v-else @click="checkUser">自用</el-menu-item>
    </el-menu>
  </div>
  <el-watermark :font="font" content="JcTools">
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

import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/Home.vue'

const router = createRouter({
  history: createWebHashHistory('/jc-tools/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      // redirect: '/transformer'
    },
    {
      path: '/cropper',
      name: 'cropper',
      component: () => import('../views/Cropper.vue'),
    },
    {
      path: '/transformer',
      name: 'transformer',
      component: () => import('../views/Transformer.vue'),
    },
  ],
})

export default router

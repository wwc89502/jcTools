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
      path: '/canvas-resolution',
      name: 'canvasResolution',
      component: () => import('../views/CanvasResolution.vue'),
    },
    {
      path: '/image-resolution',
      name: 'imageResolution',
      component: () => import('../views/ImageResolution.vue'),
    },
    {
      path: '/transformer',
      name: 'transformer',
      component: () => import('../views/Transformer.vue'),
    },
  ],
})

export default router

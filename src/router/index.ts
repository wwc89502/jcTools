import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
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

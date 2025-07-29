import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import { decryptedSM4 } from '@/utils/sm4.ts'
import { useGlobalStore } from '@/stores'

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
      path: '/cropper2',
      name: 'cropper2',
      component: () => import('../views/Cropper2.vue'),
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
    {
      path: '/cll',
      name: 'cll',
      component: () => import('../views/Cll.vue'),
      meta: { auth: true }
    },
    {
      path: '/pwdList',
      name: 'pwdList',
      component: () => import('../views/PwdList.vue'),
      meta: { auth: true }
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const globalStore = useGlobalStore()
  if (to.meta.auth) {
    if (decryptedSM4('8deecbc38f8250adc39387a274852e11', globalStore.password + '123456789abc98741236') === 'jc8866') {
      next()
    } else {
      next('/')
    }
  } else {
    next()
  }
})

export default router

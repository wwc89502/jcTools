import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import VueCropper from 'vue-cropper'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import './assets/main.css'
import 'vue-cropper/dist/index.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.use(ElementPlus, {
  locale: zhCn,
})
app.use(VueCropper as any)
app.mount('#app')

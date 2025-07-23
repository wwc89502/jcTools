import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useGlobalStore = defineStore('global', () => {
  const password = ref('')
  function setPassword (pwd: string) {
    password.value = pwd
  }

  return { password, setPassword }
},
  {
    persist: {
      storage: sessionStorage
    }
  })

import { sm4 } from 'sm-crypto'

const SM4Data = {
  key: '0123456789abcdeffedcba9876543210',
  iv: 'fedcba98765432100123456789abcdef'
}

export const encryptSM4 = (data = '', key = '', iv = '') => {
  try {
    return sm4.encrypt(
      data,
      key || SM4Data.key,
      {mode: 'cbc', iv: iv || SM4Data.iv}
    )
  } catch (err: any) {
    ElMessage.error('加密失败 ' + err.message)
  }
}
//解密
export const decryptedSM4 = (data = '', key =  '', iv = '') => {
  try {
    return sm4.decrypt(
      data,
      key || SM4Data.key,
      {mode: 'cbc', iv: iv || SM4Data.iv}
    )
  } catch (err: any) {
    ElMessage.error('解密失败 ' + err.message)
  }
}

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { decryptedSM4, encryptSM4 } from '@/utils/sm4.ts'
import { copyText } from '@/utils'
const pwdList = [
  {
    "name": "yh用户端",
    "enAccount": "b677a48de6cccf3b5c273e9884bb9616",
    "enPassword": "1ae25d57f008cd4babc691136d25131e",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "yh管理端",
    "enAccount": "6a2d1c68992e02e46e7afb9366e16728",
    "enPassword": "3b73b30a076405756aa9b5288f99210da6ac1c58b348974d06f04309ad35736d",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "yh物资端",
    "enAccount": "1aa6d09e8c23d2d17b8898e904033dd3",
    "enPassword": "1aa6d09e8c23d2d17b8898e904033dd3",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "smzx用户端",
    "enAccount": "0370e7351b4c38e211934fa666823244",
    "enPassword": "73d771f1131ec03164e8bc4318d3e1fc",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "smzx管理端",
    "enAccount": "6a2d1c68992e02e46e7afb9366e16728",
    "enPassword": "d9072ba04abc8f6c48667d454192400fa04a971bbcadee893411cf43e5492d26",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "lp用户端-p",
    "enAccount": "b677a48de6cccf3b5c273e9884bb9616",
    "enPassword": "6f70f7fa1e38bd98cc378ccff2521e43",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "lp用户端-u",
    "enAccount": "180a3125edfd30a473aac671b4f1db22",
    "enPassword": "4e74ddbcfd53cb4bed6eb99eb0b1a809",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "lp管理端",
    "enAccount": "2d0be106b4051fa636f9e63f41015053",
    "enPassword": "960f7c773f466718cf10fc7caf44c8160842d4d0ad293923845b18a1c7f4a99d",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "la用户端",
    "enAccount": "4d310f570ff9b8e58b676ba72beeadad",
    "enPassword": "7e108f87d858e2c6bfd55a8c25152e2e069bfce52603dfed9fcf45e3d48dc284",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "la管理端",
    "enAccount": "6a2d1c68992e02e46e7afb9366e16728",
    "enPassword": "51609b3f88e989984d3e28d4c2eb71fd",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "xa管理端",
    "enAccount": "d172da191bfee6f68e657055fe5378e6",
    "enPassword": "1aa6d09e8c23d2d17b8898e904033dd3",
    "enPassword2": "c839cd7f8c60aa377573f10af647e8ca"
  },
  {
    "name": "xa物资端",
    "enAccount": "1aa6d09e8c23d2d17b8898e904033dd3",
    "enPassword": "1aa6d09e8c23d2d17b8898e904033dd3",
    "enPassword2": "26bf65ef74aa2ac503aea55f5425cb7b560a606467e9696b039d990441223cc4"
  },
  // {
  //   name: 'xa用户端',
  //   enAccount: 'mifan',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'qt用户端',
  //   enAccount: 'mifan',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'qt管理端',
  //   enAccount: 'hanchen',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'sc用户端',
  //   enAccount: 'mifan',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'sc管理端',
  //   enAccount: 'hanchen',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'lx用户端',
  //   enAccount: 'mifan',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'lx管理端',
  //   enAccount: 'hanchen',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'fy用户端',
  //   enAccount: 'mifan',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'fy管理端',
  //   enAccount: 'hanchen',
  //   enPassword: '88877cb99%G@',
  //   enPassword2: '',
  // },
  // {
  //   name: 'fj物资端',
  //   enAccount: '18812341234',
  //   enPassword: '18812341234',
  //   enPassword2: '',
  // },
]

const sm4Form = ref({
  str: '',
  key: '',
  iv: '',
  renderStr: ''
})

const en = () => {
  sm4Form.value.renderStr = encryptSM4(sm4Form.value.str, sm4Form.value.key, sm4Form.value.iv) as string
}

const de = () => {
  sm4Form.value.renderStr = decryptedSM4(sm4Form.value.str, sm4Form.value.key, sm4Form.value.iv) as string
}

const deRow = (row) => {
  copyText(`
  name: ${row.name}
  account: ${decryptedSM4(row.enAccount, sm4Form.value.key + '123456789abc98741236')}
  password: ${decryptedSM4(row.enPassword, sm4Form.value.key + '123456789abc98741236')}
  password2: ${decryptedSM4(row.enPassword2, sm4Form.value.key + '123456789abc98741236')}
  `)
}

const enList = () => {
  const key = '' + '123456789abc98741236'
  return pwdList.map((item) => ({
    name: item.name,
    enAccount: encryptSM4(item.enAccount, key),
    enPassword: encryptSM4(item.enPassword, key),
    enPassword2: encryptSM4(item.enPassword2, key),
  }))
}

onMounted(() => {
  // console.log(enList())
})
</script>

<template>
  <div class="content">
    <el-form inline :model="sm4Form">
      <el-form-item label="字符串">
        <el-input v-model="sm4Form.str"></el-input>
      </el-form-item>
      <el-form-item label="key">
        <el-input v-model="sm4Form.key"></el-input>
      </el-form-item>
      <el-form-item label="iv">
        <el-input v-model="sm4Form.iv"></el-input>
      </el-form-item>
      <el-form-item label="加/解密后字符串">
        <el-input v-model="sm4Form.renderStr" readonly></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="en()">加密</el-button>
        <el-button type="primary" plain @click="de()">解密</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="pwdList">
      <el-table-column label="名称" prop="name" width="160"></el-table-column>
      <el-table-column label="账号" prop="enAccount"></el-table-column>
      <el-table-column label="密码" prop="enPassword"></el-table-column>
      <el-table-column label="密码2" prop="enPassword2"></el-table-column>
      <el-table-column label="操作" width="60">
        <template #default="{row}">
          <el-button type="primary" link @click="deRow(row)">解密</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.content {
  max-width: 1200px;
  width: 90%;
  padding: 40px;
  margin: 0 auto;
}
</style>

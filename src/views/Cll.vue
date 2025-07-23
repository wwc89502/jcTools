<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FoodsDb from '@/db/foods-db.ts'
import UserFoodsDb from '@/db/user-foods-db.ts'
import {
  DeleteFilled
} from '@element-plus/icons-vue'

const list = ref<any>([])
const batchInfo = ref<any>({})
const addForm = ref<any>({})
const addFormRule = {
  name: [
    { required: true, message: '请输入名称' },
  ],
  size: [
    { required: true, message: '请输入数量/重量' },
  ],
  cal: [
    { required: true, message: '请输入卡路里' },
  ],
  unit: [
    { required: true, message: '请选择/输入单位' },
  ],
}
const addFormRef = ref<any>()

const addItem = () => {
  addFormRef.value.validate(async (valid) => {
    if (valid) {
      await FoodsDb.add(addForm.value)
      await getList()
      ElMessage.success('添加成功')
      addFormRef.value.resetFields()
    }
  })
}

const editItem = async (row) => {
  await FoodsDb.update(row)
  await getList()
  ElMessage.success('修改成功')
}

const delItem = (row) => {
  ElMessageBox.confirm('确定要删除吗？', '提示', {}).then(async () => {
    await FoodsDb.del(row.id)
    await getList()
    ElMessage.success('删除成功')
  })
}

const saveTable = async () => {
  await UserFoodsDb.update({
    ...batchInfo.value,
    batch: JSON.stringify(batchInfo.value.batch),
  })
  renderList.value = []
  ElMessage.success('保存成功')
}

const addGroup = (row) => {
  if (!row.group) row.group = []
  row.group.push({ key: [] })
}
const delGroup = ($index, index) => {
  batchInfo.value.batch[$index].group.splice(index, 1)
}
const getRandom = (arr) => {
  const length = arr.length
  const randomIndex = Math.floor(Math.random() * length)
  return arr[randomIndex]
}
const renderList = ref<any>([])
const render = () => {
  renderList.value = batchInfo.value.batch.map(item => {
    let foodIds: number[] = []

    item.group.forEach((_, _i) => {
      foodIds.push(getRandom(_.key))
    })

    let foods: string[] = []
    foodIds.forEach((_, _i) => {
      const row = list.value.find(item => item.id === _)
      foods.push(`${row.name} ${row.size}${row.unit}`)
    })

    return {
      name: item.name,
      foods: foods.join(','),
    }
  })
}

const dialogFormVisible = ref(false)

const getList = async () => {
  list.value = await FoodsDb.getList()
  const userFoodsList = await UserFoodsDb.getList()
  batchInfo.value = userFoodsList[0].batch ? {
    ...userFoodsList[0],
    batch: JSON.parse(userFoodsList[0].batch)
  } : {}
}

onMounted(async () => {
  await getList()
})
</script>

<template>
  <div class="container">
    <el-card class="add">
      <el-form ref="addFormRef" :model="addForm" :rules="addFormRule" inline>
        <el-form-item prop="name" label="食物名称">
          <el-input v-model="addForm.name"></el-input>
        </el-form-item>
        <el-form-item prop="size" label="数量/重量">
          <el-input-number controls-position="right" v-model="addForm.size"></el-input-number>
        </el-form-item>
        <el-form-item prop="cal" label="卡路里">
          <el-input-number controls-position="right" v-model="addForm.cal">
            <template #suffix>
              千卡
            </template>
          </el-input-number>
        </el-form-item>
        <el-form-item prop="unit" label="单位">
          <el-select v-model="addForm.unit" allow-create filterable>
            <el-option value="g"></el-option>
            <el-option value="个"></el-option>
            <el-option value="片"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addItem">添加</el-button>
          <el-button type="primary" plain @click="dialogFormVisible = true">维护</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="top">
      <el-table stripe :data="batchInfo.batch">
        <el-table-column prop="name" label="餐次" width="100"></el-table-column>

        <el-table-column label="组别">
          <template #default="{row, $index}">
            <div class="group" v-if="row.group?.length">
              <el-form-item :label="`组${index + 1}`" class="item" v-for="(item, index) in row.group" :key="index">
                <div class="form-item">
                  <el-select v-model="item.key" multiple collapse-tags collapse-tags-tooltip>
                    <el-option v-for="_ in list" :key="_.id" :label="`${_.name} ${_.size}${_.unit}`" :value="_.id"></el-option>
                  </el-select>
                  <el-button type="danger" link v-if="row.group.length > 1" @click="delGroup($index, index)" :icon="DeleteFilled"></el-button>
                </div>
              </el-form-item>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100">
          <template #default="{row}">
            <el-button type="primary" link @click="addGroup(row)">添加组</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <div class="mid">
      <el-button type="primary" @click="saveTable">保存表</el-button>
      <el-button type="primary" @click="render">{{ renderList.length ? '重新生成食谱' : '生成食谱' }}</el-button>
    </div>
    <el-card>
      <el-table stripe :data="renderList">
        <el-table-column prop="name" label="餐次" width="100"></el-table-column>
        <el-table-column prop="foods" label="食物"></el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogFormVisible" title="食物维护" width="1000">
      <el-table :data="list" height="60vh">
        <el-table-column prop="id" label="ID" width="80"/>
        <el-table-column prop="name" label="食物">
          <template #default="{row}">
            <el-input v-model="row.name"></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="数量/重量">
          <template #default="{row}">
            <el-input-number controls-position="right" v-model="row.size"></el-input-number>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="卡路里">
          <template #default="{row}">
            <el-input-number controls-position="right" v-model="row.cal">
              <template #suffix>
                千卡
              </template>
            </el-input-number>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位">
          <template #default="{row}">
            <el-select v-model="row.unit" allow-create filterable>
              <el-option value="g"></el-option>
              <el-option value="个"></el-option>
              <el-option value="片"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{row}">
            <el-button type="primary" link @click="editItem(row)">保存</el-button>
            <el-button type="danger" link @click="delItem(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 40px;

  .add {
    margin-bottom: 20px;
    .el-form--inline .el-form-item {
      margin-right: 12px;
      margin-bottom: 0;
    }
    .el-select,
    .el-input-number,
    .el-input {
      width: 140px;
    }
  }

  .top {
    :deep(.group) {
      display: flex;
      flex-wrap: wrap;
      .el-form-item {
        margin-right: 12px;
        margin-bottom: 12px;

        .form-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          .el-select {
            width: 200px;
          }
        }
      }
    }
  }

  .mid {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 20px 0;
  }
}
</style>

<script setup lang="ts">
withDefaults(defineProps<{ modelValue: boolean; label?: string }>(), { label: '宽高比例' })
defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <button
    type="button"
    class="aspect-ratio-toggle"
    :class="{ active: modelValue }"
    :aria-label="`${modelValue ? '取消锁定' : '锁定'}${label}`"
    :aria-pressed="modelValue"
    :title="`${modelValue ? '取消锁定' : '锁定'}${label}`"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <template v-if="modelValue">
        <path d="M10 8H7a4 4 0 0 0 0 8h3M14 8h3a4 4 0 0 1 0 8h-3" />
        <path d="M8 12h8" />
      </template>
      <template v-else>
        <path d="M8 8H6a4 4 0 0 0 0 8h2M16 8h2a4 4 0 0 1 0 8h-2" />
        <path d="M7 12h2m6 0h2M12 5v3m0 8v3" />
      </template>
    </svg>
  </button>
</template>

<style scoped>
.aspect-ratio-toggle {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  color: var(--el-text-color-regular);
  background: transparent;
  cursor: pointer;
}
.aspect-ratio-toggle:hover,
.aspect-ratio-toggle.active {
  color: var(--el-color-primary);
}
.aspect-ratio-toggle svg {
  width: 20px;
  height: 20px;
}
</style>

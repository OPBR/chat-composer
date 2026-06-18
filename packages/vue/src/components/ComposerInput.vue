<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  initComposer: (el: HTMLElement) => void
  placeholder?: string
}>()

const el = ref<HTMLElement>()

onMounted(() => {
  if (el.value) props.initComposer(el.value)
})
</script>

<template>
  <div
    ref="el"
    contenteditable
    data-cc-input
    :data-placeholder="placeholder"
  />
</template>

<style scoped>
[data-cc-input] {
  min-height: 40px;
  padding: 8px 12px;
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}

[data-cc-input]:empty::before {
  content: attr(data-placeholder);
  color: #999;
  pointer-events: none;
}
</style>

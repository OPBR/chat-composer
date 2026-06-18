<script setup lang="ts">
import { computed } from 'vue'
import type { MentionItem } from '@chat-composer/core'

defineProps<{
  items: MentionItem[]
  activeIndex: number
}>()

const emit = defineEmits<{
  select: [item: MentionItem]
}>()

const position = computed(() => {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return { left: 0, top: 0 }
  const range = sel.getRangeAt(0).cloneRange()
  range.collapse(true)
  const rect = range.getBoundingClientRect()
  return { left: rect.left, top: rect.bottom + 4 }
})

function handleMouseDown(e: MouseEvent, item: MentionItem) {
  e.preventDefault()
  emit('select', item)
}
</script>

<template>
  <div
    v-if="items.length > 0"
    class="cc-mention-dropdown"
    :style="{ left: position.left + 'px', top: position.top + 'px' }"
  >
    <slot name="item" :item="undefined" :is-active="false" />
    <div
      v-for="(item, i) in items"
      :key="item.id"
      class="cc-mention-item"
      :class="{ 'cc-mention-item--active': i === activeIndex }"
      @mousedown="handleMouseDown($event, item)"
    >
      <slot name="item" :item="item" :is-active="i === activeIndex">
        <span class="cc-mention-item-label">{{ item.label }}</span>
        <span v-if="item.description" class="cc-mention-item-desc">
          {{ item.description }}
        </span>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.cc-mention-dropdown {
  position: absolute;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 4px;
  max-height: 160px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 180px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.cc-mention-item {
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cc-mention-item--active {
  background: #e3f2fd;
}

.cc-mention-item-label {
  font-weight: 500;
}

.cc-mention-item-desc {
  font-size: 0.8em;
  color: #888;
  margin-left: 8px;
}
</style>

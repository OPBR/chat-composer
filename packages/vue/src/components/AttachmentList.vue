<script setup lang="ts">
import type { AttachmentPart } from '@chat-composer/core'

defineProps<{
  attachments: AttachmentPart[]
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div v-if="attachments.length > 0" class="cc-attachment-list">
    <div
      v-for="att in attachments"
      :key="att.id"
      class="cc-attachment-item"
    >
      <slot name="item" :attachment="att" :on-remove="() => emit('remove', att.id)">
        <img
          v-if="att.type === 'image' && att.localUrl"
          :src="att.localUrl"
          :alt="att.fileName"
          class="cc-attachment-thumb"
        />
        <span v-if="att.type === 'file'" class="cc-attachment-icon">📄</span>
        <span class="cc-attachment-name">{{ att.fileName }}</span>
        <span class="cc-attachment-size">{{ formatBytes(att.sizeBytes) }}</span>
        <span
          v-if="att.uploadStatus === 'uploading'"
          class="cc-attachment-status cc-attachment-status--uploading"
          title="Uploading..."
        >⏳</span>
        <span
          v-else-if="att.uploadStatus === 'error'"
          class="cc-attachment-status cc-attachment-status--error"
          title="Upload failed"
        >✗</span>
        <span
          v-else-if="att.uploadStatus === 'uploaded'"
          class="cc-attachment-status cc-attachment-status--done"
          title="Uploaded"
        >✓</span>
        <button
          class="cc-attachment-remove"
          title="Remove"
          @click="emit('remove', att.id)"
        >×</button>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.cc-attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
}

.cc-attachment-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.85em;
}

.cc-attachment-thumb {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}

.cc-attachment-icon {
  color: #666;
}

.cc-attachment-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-attachment-size {
  color: #999;
  font-size: 0.85em;
}

.cc-attachment-status {
  font-size: 0.7em;
}

.cc-attachment-status--uploading {
  color: #1976d2;
}

.cc-attachment-status--error {
  color: #d32f2f;
}

.cc-attachment-status--done {
  color: #388e3c;
}

.cc-attachment-remove {
  border: none;
  background: none;
  cursor: pointer;
  color: #999;
  font-size: 0.9em;
  padding: 0 2px;
  line-height: 1;
}
</style>

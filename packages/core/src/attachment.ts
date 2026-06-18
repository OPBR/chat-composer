import type { AttachmentConfig, AttachmentPart, ImagePart, FilePart, UploadHandler } from './types'

function generateId(): string {
  return `cc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createAttachmentManager(config?: AttachmentConfig, onUpload?: UploadHandler) {
  const { maxFiles = 10, maxFileSizeBytes = 10 * 1024 * 1024, accept, onReject } = config ?? {}

  const attachments = new Map<string, AttachmentPart>()

  function attachFile(file: File): AttachmentPart | null {
    if (attachments.size >= maxFiles) {
      onReject?.('count', file)
      return null
    }
    if (file.size > maxFileSizeBytes) {
      onReject?.('size', file)
      return null
    }
    if (accept && !accept.some((a) => file.type.match(a.replace('*', '.*')))) {
      onReject?.('type', file)
      return null
    }

    const id = generateId()

    if (file.type.startsWith('image/')) {
      const part: ImagePart = {
        type: 'image',
        id,
        file,
        localUrl: URL.createObjectURL(file),
        uploadStatus: 'local',
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }
      attachments.set(id, part)
      return part
    }

    const part: FilePart = {
      type: 'file',
      id,
      file,
      uploadStatus: 'local',
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }
    attachments.set(id, part)
    return part
  }

  function removeAttachment(id: string): boolean {
    const part = attachments.get(id)
    if (!part) return false

    // Revoke object URLs to prevent memory leaks
    if (part.type === 'image') URL.revokeObjectURL(part.localUrl)
    if (part.type === 'file' && part.localUrl) URL.revokeObjectURL(part.localUrl)

    attachments.delete(id)
    return true
  }

  function getById(id: string): AttachmentPart | undefined {
    return attachments.get(id)
  }

  async function uploadAttachment(id: string): Promise<boolean> {
    const part = attachments.get(id)
    if (!part || !onUpload) return false

    part.uploadStatus = 'uploading'

    try {
      const remoteUrl = await onUpload(part.file, id)
      part.remoteUrl = remoteUrl
      part.uploadStatus = 'uploaded'
      part.uploadError = undefined
    } catch (err) {
      part.uploadStatus = 'error'
      part.uploadError = err instanceof Error ? err.message : String(err)
    }

    return true
  }

  function getAll(): AttachmentPart[] {
    return Array.from(attachments.values())
  }

  function clear(): void {
    for (const part of attachments.values()) {
      if (part.type === 'image') URL.revokeObjectURL(part.localUrl)
      if (part.type === 'file' && part.localUrl) URL.revokeObjectURL(part.localUrl)
    }
    attachments.clear()
  }

  return { attachFile, removeAttachment, getById, uploadAttachment, getAll, clear }
}

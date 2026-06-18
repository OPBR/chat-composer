import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAttachmentManager } from '../attachment'
import type { AttachmentConfig } from '../types'

function createMockFile(name: string, type: string, size: number): File {
  const content = new Uint8Array(size)
  const file = new File([content], name, { type, lastModified: Date.now() })
  // jsdom File.size may not match content length, so override if needed
  if (file.size !== size) {
    Object.defineProperty(file, 'size', { value: size, configurable: true })
  }
  return file
}

describe('createAttachmentManager', () => {
  let manager: ReturnType<typeof createAttachmentManager>

  beforeEach(() => {
    manager = createAttachmentManager()
  })

  describe('attachFile', () => {
    it('creates an ImagePart for image files', () => {
      const file = createMockFile('photo.png', 'image/png', 1024)
      const part = manager.attachFile(file)!
      expect(part.type).toBe('image')
      expect(part.id).toBeTruthy()
      expect(part.fileName).toBe('photo.png')
      expect(part.mimeType).toBe('image/png')
      expect(part.sizeBytes).toBe(1024)
      expect(part.uploadStatus).toBe('local')
      expect(part.localUrl).toBeTruthy()
    })

    it('creates a FilePart for non-image files', () => {
      const file = createMockFile('doc.pdf', 'application/pdf', 2048)
      const part = manager.attachFile(file)!
      expect(part.type).toBe('file')
      expect(part.id).toBeTruthy()
      expect(part.fileName).toBe('doc.pdf')
      expect(part.mimeType).toBe('application/pdf')
      expect(part.sizeBytes).toBe(2048)
      expect(part.uploadStatus).toBe('local')
    })

    it('rejects files exceeding maxFileSizeBytes', () => {
      const onReject = vi.fn()
      const config: AttachmentConfig = { maxFileSizeBytes: 100, onReject }
      const localManager = createAttachmentManager(config)
      const file = createMockFile('big.png', 'image/png', 200)
      const part = localManager.attachFile(file)
      expect(part).toBeNull()
      expect(onReject).toHaveBeenCalledWith('size', file)
    })

    it('rejects files exceeding maxFiles count', () => {
      const onReject = vi.fn()
      const config: AttachmentConfig = { maxFiles: 2, onReject }
      const localManager = createAttachmentManager(config)
      localManager.attachFile(createMockFile('a.png', 'image/png', 10))
      localManager.attachFile(createMockFile('b.png', 'image/png', 10))
      const file3 = createMockFile('c.png', 'image/png', 10)
      const part = localManager.attachFile(file3)
      expect(part).toBeNull()
      expect(onReject).toHaveBeenCalledWith('count', file3)
    })

    it('rejects files with unaccepted MIME types', () => {
      const onReject = vi.fn()
      const config: AttachmentConfig = { accept: ['image/*'], onReject }
      const localManager = createAttachmentManager(config)
      const file = createMockFile('doc.pdf', 'application/pdf', 10)
      const part = localManager.attachFile(file)
      expect(part).toBeNull()
      expect(onReject).toHaveBeenCalledWith('type', file)
    })

    it('accepts files matching accept patterns', () => {
      const config: AttachmentConfig = { accept: ['image/*', 'application/pdf'] }
      const localManager = createAttachmentManager(config)
      const file = createMockFile('doc.pdf', 'application/pdf', 10)
      const part = localManager.attachFile(file)
      expect(part).not.toBeNull()
      expect(part!.type).toBe('file')
    })
  })

  describe('removeAttachment', () => {
    it('removes an attachment by id', () => {
      const file = createMockFile('photo.png', 'image/png', 1024)
      const part = manager.attachFile(file)
      expect(manager.getAll()).toHaveLength(1)
      manager.removeAttachment(part!.id)
      expect(manager.getAll()).toHaveLength(0)
    })

    it('returns false for unknown id', () => {
      expect(manager.removeAttachment('nonexistent')).toBe(false)
    })
  })

  describe('getById', () => {
    it('returns attachment by id', () => {
      const file = createMockFile('photo.png', 'image/png', 1024)
      const part = manager.attachFile(file)
      expect(manager.getById(part!.id)).toBe(part)
    })

    it('returns undefined for unknown id', () => {
      expect(manager.getById('nonexistent')).toBeUndefined()
    })
  })

  describe('uploadAttachment', () => {
    it('transitions uploadStatus through uploading → uploaded', async () => {
      const onUpload = vi.fn().mockResolvedValue('https://cdn.example.com/photo.png')
      const localManager = createAttachmentManager(undefined, onUpload)
      const file = createMockFile('photo.png', 'image/png', 1024)
      const part = localManager.attachFile(file)

      await localManager.uploadAttachment(part!.id)
      const updated = localManager.getById(part!.id)
      expect(updated!.uploadStatus).toBe('uploaded')
      expect(updated!.remoteUrl).toBe('https://cdn.example.com/photo.png')
    })

    it('transitions uploadStatus to error on upload failure', async () => {
      const onUpload = vi.fn().mockRejectedValue(new Error('Upload failed'))
      const localManager = createAttachmentManager(undefined, onUpload)
      const file = createMockFile('photo.png', 'image/png', 1024)
      const part = localManager.attachFile(file)

      await localManager.uploadAttachment(part!.id)
      const updated = localManager.getById(part!.id)
      expect(updated!.uploadStatus).toBe('error')
      expect(updated!.uploadError).toBe('Upload failed')
    })

    it('returns false for unknown id', async () => {
      expect(await manager.uploadAttachment('nonexistent')).toBe(false)
    })

    it('returns false when no onUpload handler', async () => {
      const file = createMockFile('photo.png', 'image/png', 1024)
      const part = manager.attachFile(file)
      expect(await manager.uploadAttachment(part!.id)).toBe(false)
    })
  })

  describe('clear', () => {
    it('removes all attachments', () => {
      manager.attachFile(createMockFile('a.png', 'image/png', 10))
      manager.attachFile(createMockFile('b.pdf', 'application/pdf', 20))
      expect(manager.getAll()).toHaveLength(2)
      manager.clear()
      expect(manager.getAll()).toHaveLength(0)
    })
  })
})

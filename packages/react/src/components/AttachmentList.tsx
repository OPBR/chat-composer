import type { CSSProperties, ReactNode } from 'react'
import type { AttachmentPart } from '@chat-composer/core'

export interface AttachmentListProps {
  attachments: AttachmentPart[]
  onRemove: (id: string) => void
  className?: string
  style?: CSSProperties
  renderItem?: (attachment: AttachmentPart, onRemove: () => void) => ReactNode
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function UploadStatusIndicator({ status }: { status: AttachmentPart['uploadStatus'] }) {
  switch (status) {
    case 'uploading':
      return (
        <span style={{ fontSize: '0.7em', color: '#1976d2' }} title="Uploading...">
          ⏳
        </span>
      )
    case 'error':
      return (
        <span style={{ fontSize: '0.7em', color: '#d32f2f' }} title="Upload failed">
          ✗
        </span>
      )
    case 'uploaded':
      return (
        <span style={{ fontSize: '0.7em', color: '#388e3c' }} title="Uploaded">
          ✓
        </span>
      )
    default:
      return null
  }
}

export function AttachmentList({
  attachments,
  onRemove,
  className,
  style,
  renderItem,
}: AttachmentListProps) {
  if (attachments.length === 0) return null

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: '4px 0',
        ...style,
      }}
    >
      {attachments.map((att) => {
        const handleRemove = () => onRemove(att.id)
        if (renderItem) return renderItem(att, handleRemove)

        return (
          <div
            key={att.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f5f5f5',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: '0.85em',
            }}
          >
            {att.type === 'image' && att.localUrl && (
              <img
                src={att.localUrl}
                alt={att.fileName}
                style={{
                  width: 32,
                  height: 32,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />
            )}
            {att.type === 'file' && <span style={{ color: '#666' }}>📄</span>}
            <span
              style={{
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {att.fileName}
            </span>
            <span style={{ color: '#999', fontSize: '0.85em' }}>{formatBytes(att.sizeBytes)}</span>
            <UploadStatusIndicator status={att.uploadStatus} />
            <button
              onClick={handleRemove}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#999',
                fontSize: '0.9em',
                padding: '0 2px',
                lineHeight: 1,
              }}
              title="Remove"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

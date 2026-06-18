import { type CSSProperties, type ReactNode } from 'react'
import type { MentionItem } from '@chat-composer/core'

export interface MentionDropdownProps {
  items: MentionItem[]
  activeIndex: number
  onSelect: (item: MentionItem) => void
  className?: string
  style?: CSSProperties
  renderItem?: (item: MentionItem, isActive: boolean) => ReactNode
}

function getCaretRect(): DOMRect | null {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return null
  const range = sel.getRangeAt(0).cloneRange()
  range.collapse(true)
  return range.getBoundingClientRect()
}

export function MentionDropdown({
  items,
  activeIndex,
  onSelect,
  className,
  style,
  renderItem,
}: MentionDropdownProps) {
  const rect = getCaretRect()
  const position = rect ? { left: rect.left, top: rect.bottom + 4 } : { left: 0, top: 0 }

  if (items.length === 0) return null

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: 4,
        maxHeight: 160,
        overflowY: 'auto',
        zIndex: 1000,
        minWidth: 180,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        ...style,
      }}
    >
      {items.map((item, i) => {
        const isActive = i === activeIndex
        return (
          <div
            key={item.id}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(item)
            }}
            style={{
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: 4,
              background: isActive ? '#e3f2fd' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {renderItem ? (
              renderItem(item, isActive)
            ) : (
              <>
                <span style={{ fontWeight: 500 }}>{item.label}</span>
                {item.description && (
                  <span style={{ fontSize: '0.8em', color: '#888', marginLeft: 8 }}>
                    {item.description}
                  </span>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

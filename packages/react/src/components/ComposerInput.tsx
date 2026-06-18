import { useEffect, type RefObject, type CSSProperties } from 'react'

let styleInjected = false

function injectPlaceholderStyle() {
  if (styleInjected || typeof document === 'undefined') return
  const style = document.createElement('style')
  style.textContent = `
    [data-cc-input]:empty::before {
      content: attr(data-placeholder);
      color: #999;
      pointer-events: none;
    }
  `
  document.head.appendChild(style)
  styleInjected = true
}

export interface ComposerInputProps {
  inputRef: RefObject<HTMLDivElement | null>
  placeholder?: string
  className?: string
  style?: CSSProperties
}

export function ComposerInput({ inputRef, placeholder, className, style }: ComposerInputProps) {
  useEffect(() => {
    injectPlaceholderStyle()
  }, [])

  return (
    <div
      ref={inputRef}
      contentEditable
      data-cc-input
      data-placeholder={placeholder}
      className={className}
      style={{
        minHeight: 40,
        padding: '8px 12px',
        outline: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...style,
      }}
    />
  )
}

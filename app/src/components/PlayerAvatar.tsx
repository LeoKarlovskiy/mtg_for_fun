import { useRef } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'

type PlayerAvatarProps = {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  onUpload?: (file: File) => void
}

const SIZE_MAP = {
  sm: { outer: '2rem', font: '0.75rem' },
  md: { outer: '3.5rem', font: '1rem' },
  lg: { outer: '5rem', font: '1.5rem' },
}

export function PlayerAvatar({ src, name, size = 'md', onUpload }: PlayerAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { outer, font } = SIZE_MAP[size]

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUpload) onUpload(file)
  }

  const containerStyle: CSSProperties = {
    width: outer,
    height: outer,
    minWidth: outer,
    borderRadius: '50%',
    border: '1px solid #B8860B',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg-raised)',
    cursor: onUpload ? 'pointer' : 'default',
    flexShrink: 0,
  }

  return (
    <div style={containerStyle} onClick={() => onUpload && inputRef.current?.click()}>
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: font, color: 'var(--color-gold-muted)', fontWeight: 600 }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      {onUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      )}
    </div>
  )
}

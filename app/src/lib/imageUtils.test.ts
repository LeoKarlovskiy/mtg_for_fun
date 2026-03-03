import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processAvatar } from './imageUtils'

describe('processAvatar', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'Image' as never).mockImplementation(() => {
      const img = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
        width: 400,
        height: 300,
      }
      Object.defineProperty(img, 'src', {
        set(val: string) {
          this._src = val
          setTimeout(() => this.onload?.(), 0)
        },
        get() { return this._src },
      })
      return img as unknown as HTMLImageElement
    })

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: vi.fn() }),
          toDataURL: () => 'data:image/jpeg;base64,mockdata',
        } as unknown as HTMLCanvasElement
      }
      return document.createElement(tag)
    })
  })

  it('returns a data URL string starting with data:image/jpeg;base64,', async () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const result = await processAvatar(file)
    expect(result).toMatch(/^data:image\/jpeg;base64,/)
  })
})

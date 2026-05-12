import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { useThemeStore } from '../../store/themeStore'

export default function EmojiButton({ onSelect }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { theme } = useThemeStore()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-secondary hover:text-purple-400 transition p-1"
      >
        <Smile size={20} />
      </button>
      {open && (
        <div className="absolute bottom-10 right-0 z-50">
          <EmojiPicker
            theme={theme}
            onEmojiClick={(e) => { onSelect(e.emoji); setOpen(false) }}
            width={300}
            height={380}
            searchDisabled={false}
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  )
}

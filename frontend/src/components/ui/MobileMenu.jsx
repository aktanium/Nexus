import { Menu, X } from 'lucide-react'

export default function MobileMenu({ open, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="mobile-only p-2 rounded-lg hover:bg-white/10 transition"
    >
      {open ? <X size={20} /> : <Menu size={20} />}
    </button>
  )
}

import { useRef } from 'react'
import { ImageIcon } from 'lucide-react'
import { api } from '../../utils/api'
import toast from 'react-hot-toast'

export default function ImageUpload({ onImageSelect }) {
  const fileRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image')
    if (file.size > 5 * 1024 * 1024) return toast.error('Image too large (max 5MB)')

    const toastId = toast.loading('Uploading image...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/api/messages/upload-image', formData)
      onImageSelect(data.image_url)
      toast.success('Image ready!', { id: toastId })
    } catch {
      toast.error('Upload failed', { id: toastId })
    }
    e.target.value = ''
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        className="text-secondary hover:text-purple-400 transition p-1"
        title="Send image"
      >
        <ImageIcon size={20} />
      </button>
    </>
  )
}

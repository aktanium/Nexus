import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Loader, Zap } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', display_name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/register', form)
      setAuth(data.user, data.access_token)
      toast.success('Welcome to Nexus!')
      navigate('/chat')
    } catch {
      toast.error('Username or email already exists')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'username', label: 'Username', placeholder: 'johndoe', icon: User, type: 'text' },
    { key: 'display_name', label: 'Display Name', placeholder: 'John Doe', icon: User, type: 'text' },
    { key: 'email', label: 'Email', placeholder: 'you@example.com', icon: Mail, type: 'email' },
    { key: 'password', label: 'Password', placeholder: '••••••••', icon: Lock, type: 'password' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #1e0a4a 70%, #0f0f1a 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent)', filter: 'blur(60px)' }} />
        </div>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(90deg, #7c3aed 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Zap size={22} className="text-white" />
            </div>
            <span className="text-3xl font-black tracking-tight">Nexus</span>
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6">
            Join the<br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              conversation.
            </span>
          </h1>
          <p className="text-lg opacity-60 leading-relaxed max-w-sm">
            Create your free account and start messaging in seconds.
          </p>
          <div className="mt-12 space-y-4">
            {['Free forever', 'Real-time messaging', 'Emoji support', 'Dark & Light theme'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.3)' }}>
                  <span className="text-purple-300 text-xs">✓</span>
                </div>
                <span className="text-sm opacity-70">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ background: '#0f0f13' }}>
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white">Nexus</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-2">Create account</h2>
          <p className="text-gray-400 mb-8">Join Nexus — it's free</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, placeholder, icon: Icon, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                <div className="relative">
                  <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm({...form, [key]: e.target.value})}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition focus:ring-2 focus:ring-purple-500"
                    style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)' }}
                    required={key !== 'display_name'}
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 mt-2"
              style={{ background: loading ? '#4c1d95' : 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : 'Create Account →'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <p className="text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

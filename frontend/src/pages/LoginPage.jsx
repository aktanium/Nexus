import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Mail, Lock, Loader, Zap } from 'lucide-react'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      setAuth(data.user, data.access_token)
      toast.success('Welcome back!')
      navigate('/chat')
    } catch {
      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #1e0a4a 70%, #0f0f1a 100%)' }}>

        {/* Animated background circles */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)', filter: 'blur(40px)' }} />
          <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent)', filter: 'blur(60px)' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(30px)' }} />
        </div>

        {/* Grid pattern */}
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
            Connect.<br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Chat.
            </span><br />
            Collaborate.
          </h1>
          <p className="text-lg opacity-60 leading-relaxed max-w-sm">
            Real-time messaging platform built for modern teams and communities.
          </p>

          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-2xl font-black">Fast</p>
              <p className="text-sm opacity-50">Instant delivery</p>
            </div>
            <div>
              <p className="text-2xl font-black">Secure</p>
              <p className="text-sm opacity-50">JWT encrypted</p>
            </div>
            <div>
              <p className="text-2xl font-black">Live</p>
              <p className="text-sm opacity-50">WebSocket powered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ background: '#0f0f13' }}>
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-2xl font-black text-white">Nexus</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-2">Welcome back</h2>
          <p className="text-gray-400 mb-8">Sign in to continue to Nexus</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition focus:ring-2 focus:ring-purple-500"
                  style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)' }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition focus:ring-2 focus:ring-purple-500"
                  style={{ background: '#1a1a24', border: '1px solid rgba(255,255,255,0.08)' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 mt-2"
              style={{ background: loading ? '#4c1d95' : 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <p className="text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition">
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

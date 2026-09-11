import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLock, FiMail, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/Loading'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success('Welcome back, Administrator!')
      navigate('/admin/dashboard')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        'Invalid login credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-8 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-2 sm:px-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 mx-auto flex items-center justify-center text-white text-2xl shadow-xl shadow-orange-500/25 mb-4">
          <i className="fi fi-sr-coffee" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Restaurant Admin Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Sign in with administrator credentials to manage your restaurant
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 w-full">
        <div className="bg-slate-800/80 backdrop-blur-xl p-5 sm:p-8 md:p-10 shadow-2xl rounded-3xl border border-slate-700/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiMail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            {/* Default Credentials Helper */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Admin Credentials:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@example.com')
                    setPassword('password')
                  }}
                  className="text-[11px] font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                >
                  Fill Default
                </button>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                <span>admin@example.com</span>
                <span>password</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="border-white border-t-transparent" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-700/60 text-center">
            <a
              href="/menu"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors"
            >
              <span>← Go to Customer Menu</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

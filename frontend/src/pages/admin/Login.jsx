import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLock, FiMail, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Spinner } from '../../components/Loading'
import AdminLanguageSwitch from '../../components/admin/AdminLanguageSwitch'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(email, password)
      toast.success(t('welcomeBackAdmin'))
      navigate('/admin/dashboard')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        t('invalidCredentials')
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

      {/* Top Floating Language Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <AdminLanguageSwitch variant="header" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-2 sm:px-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 mx-auto flex items-center justify-center text-white text-2xl shadow-xl shadow-orange-500/25 mb-4">
          <i className="fi fi-sr-coffee" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {t('loginTitle')}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {t('loginSubtitle')}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 w-full">
        <div className="bg-slate-800/80 backdrop-blur-xl p-5 sm:p-8 md:p-10 shadow-2xl rounded-3xl border border-slate-700/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {t('emailAddress')}
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
                  placeholder={t('enterEmail')}
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('enterPassword')}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 sm:py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
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
                    <span>{t('signingIn')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('signInDashboard')}</span>
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
              <span>← {t('backToCustomerMenu')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

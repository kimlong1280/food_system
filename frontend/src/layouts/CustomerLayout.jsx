import { Outlet, useLocation, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { FiShoppingBag, FiArrowRight } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'

const CustomerLayout = () => {
  const location = useLocation()
  const { cartItemCount, cartSubtotal } = useCart()
  const { t } = useLanguage()

  // Don't show floating cart button on cart or checkout or success pages
  const hideFloatingCart = ['/cart', '/checkout', '/order-success', '/table-error'].some((path) =>
    location.pathname.startsWith(path)
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-orange-500 selection:text-white">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500',
          },
        }}
      />

      {/* Main Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-20 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Subtle Customer Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mb-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>{t('footerCopyright', { year: new Date().getFullYear() })}</p>
          <Link
            to="/admin/login"
            className="text-slate-400 hover:text-orange-600 font-semibold transition-colors flex items-center gap-1.5"
          >
            <i className="fi fi-sr-lock text-[11px]" />
            <span>{t('staffPortal')}</span>
          </Link>
        </div>
      </footer>

      {/* Floating Bottom Cart Bar (visible on mobile / menu browsing) */}
      {!hideFloatingCart && cartItemCount > 0 && (
        <div className="fixed bottom-4 inset-x-0 z-40 max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Link
            to="/cart"
            className="group flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 animate-pulse-glow"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <FiShoppingBag className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 bg-white text-orange-600 text-[10px] font-extrabold rounded-full h-4.5 min-w-4.5 px-1 flex items-center justify-center shadow-xs animate-pop">
                  {cartItemCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/90 font-medium">{t('viewCart')}</p>
                <p className="text-sm sm:text-base font-extrabold tracking-tight">
                  ${cartSubtotal.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm bg-white/20 backdrop-blur-xs px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl group-hover:bg-white/30 transition-colors">
              <span>{t('checkout')}</span>
              <FiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

export default CustomerLayout

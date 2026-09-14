import { useState } from 'react'
import { Outlet, Navigate, NavLink } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  FiMenu,
  FiShoppingBag,
  FiGrid,
  FiCoffee,
  FiLayers,
  FiMapPin,
} from 'react-icons/fi'
import Sidebar from '../components/admin/Sidebar'
import AdminLanguageSwitch from '../components/admin/AdminLanguageSwitch'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PageLoading } from '../components/Loading'

const AdminLayout = () => {
  const { isAuthenticated, loading } = useAuth()
  const { t } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const mobileNavItems = [
    { to: '/admin/orders', label: t('navOrders'), icon: <FiShoppingBag className="w-5 h-5" /> },
    { to: '/admin/dashboard', label: t('navDashboard'), icon: <FiGrid className="w-5 h-5" /> },
    { to: '/admin/categories', label: t('navCategories'), icon: <FiLayers className="w-5 h-5" /> },
    { to: '/admin/menu-items', label: t('navMenuItems'), icon: <FiCoffee className="w-5 h-5" /> },
    { to: '/admin/tables', label: t('navTables'), icon: <FiMapPin className="w-5 h-5" /> },
  ]

  if (loading) {
    return <PageLoading text={t('loading')} />
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col lg:flex-row antialiased">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500',
          },
        }}
      />

      {/* Admin Sidebar for Desktop and Full Drawer on Mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Admin Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Open Sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-black text-sm sm:text-base lg:text-lg text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
                <span>{t('restaurantAdmin')}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <AdminLanguageSwitch variant="header" />

            {/* Live Indicator */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{t('kitchenLive')}</span>
            </span>
          </div>
        </header>

        {/* Routed Sub-pages (with pb-20 on mobile so bottom nav bar never overlaps content) */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-24 lg:pb-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* ========================================================================= */}
        {/* MOBILE SMARTPHONE BOTTOM APP BAR (1-Thumb Navigation like Native Apps)     */}
        {/* ========================================================================= */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 py-1 px-2 flex items-center justify-around shadow-2xl shadow-slate-900/10">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-orange-600 font-black'
                    : 'text-slate-400 hover:text-slate-600 font-semibold'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1 rounded-xl transition-all ${
                      isActive ? 'bg-orange-50 scale-110' : ''
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default AdminLayout

import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { FiMenu } from 'react-icons/fi'
import Sidebar from '../components/admin/Sidebar'
import { useAuth } from '../context/AuthContext'
import { PageLoading } from '../components/Loading'

const AdminLayout = () => {
  const { isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return <PageLoading text="Authenticating administrator..." />
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

      {/* Admin Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Admin Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Open Sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <h1 className="font-extrabold text-sm sm:text-base lg:text-lg text-slate-900 tracking-tight">
              Restaurant Management
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] sm:text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Kitchen Online</span>
            </span>
          </div>
        </header>

        {/* Routed Sub-pages */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

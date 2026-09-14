import { NavLink, useNavigate } from 'react-router-dom'
import {
  FiGrid,
  FiShoppingBag,
  FiLayers,
  FiCoffee,
  FiMapPin,
  FiImage,
  FiUsers,
  FiLogOut,
  FiX,
  FiExternalLink,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import AdminLanguageSwitch from './AdminLanguageSwitch'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const navItems = [
    { to: '/admin/dashboard', label: t('navDashboard'), icon: <FiGrid /> },
    { to: '/admin/orders', label: t('navOrders'), icon: <FiShoppingBag /> },
    { to: '/admin/categories', label: t('navCategories'), icon: <FiLayers /> },
    { to: '/admin/menu-items', label: t('navMenuItems'), icon: <FiCoffee /> },
    { to: '/admin/tables', label: t('navTables'), icon: <FiMapPin /> },
    { to: '/admin/posters', label: t('navPosters'), icon: <FiImage /> },
    { to: '/admin/users', label: t('navUsers'), icon: <FiUsers /> },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <i className="fi fi-sr-coffee text-xl" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-tight text-white">
                {t('adminPortal')}
              </h2>
              <p className="text-[11px] text-orange-400 font-semibold">{t('restaurantHub')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
            aria-label="Close Sidebar"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-4 mt-4 border-t border-slate-800/80">
            <a
              href="/menu"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-orange-400 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FiExternalLink className="text-base" />
                <span>{t('navCustomerMenu')}</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                Live
              </span>
            </a>
          </div>
        </nav>

        {/* Language Switch & User Profile Bottom Section */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 space-y-2.5">
          <AdminLanguageSwitch variant="sidebar" />

          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs font-bold text-white truncate">{user?.name || t('adminUser')}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@restaurant.com'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors shrink-0 cursor-pointer"
              title={t('logout')}
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

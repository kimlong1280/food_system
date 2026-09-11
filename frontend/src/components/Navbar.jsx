import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingBag, FiMapPin, FiX, FiCheck, FiDollarSign, FiUsers } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import TableBillModal from './TableBillModal'

const Navbar = () => {
  const { table, setTableInfo, cartItemCount } = useCart()
  const { language, setLanguage, t } = useLanguage()
  const [showTableModal, setShowTableModal] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [availableTables, setAvailableTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)

  const handleOpenModal = async () => {
    setShowTableModal(true)
    setLoadingTables(true)
    try {
      const res = await api.get('/tables')
      setAvailableTables(res.data.data || [])
    } catch {
      // ignore
    } finally {
      setLoadingTables(false)
    }
  }

  const handleSelectTable = (tbl) => {
    setTableInfo(tbl)
    setShowTableModal(false)
    if (tbl.is_occupied) {
      toast.success(t('tableJoinedNotice', { number: tbl.table_number }), {
        duration: 4500,
        icon: '👥',
      })
    } else {
      toast.success(t('connectedToTable', { number: tbl.table_number }))
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2 sm:py-3">
          {/* Main Header Bar */}
          <div className="flex items-center justify-between gap-3">
            {/* Brand Logo & Restaurant Name (Prominent & clear on smartphones) */}
            <Link to="/menu" className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 group">
              <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300 shrink-0">
                <i className="fi fi-sr-coffee text-base sm:text-lg leading-none" />
              </div>
              <div className="min-w-0 flex-1 pr-1">
                <h1 className="font-black text-[13px] min-[360px]:text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-orange-600 transition-colors leading-tight line-clamp-1 min-[375px]:line-clamp-none">
                  {t('brandName')}
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-none mt-0.5 truncate">
                  {t('brandTagline')}
                </p>
              </div>
            </Link>

            {/* Right Section: Language Switcher, Desktop Table/Bill & Cart */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Mobile Compact Language Switcher (<sm) */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'km' : 'en')}
                className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 text-xs font-bold text-slate-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
                title={language === 'en' ? 'ប្តូរទៅភាសាខ្មែរ (Switch to Khmer)' : 'Switch to English'}
              >
                <span className="w-3.5 h-2.5 inline-block rounded-xs overflow-hidden shadow-2xs bg-slate-200 shrink-0">
                  {language === 'en' ? (
                    <svg viewBox="0 0 60 30" className="w-full h-full object-cover">
                      <clipPath id="uk-flag-m">
                        <path d="M0,0 v30 h60 v-30 z" />
                      </clipPath>
                      <clipPath id="uk-diag-m">
                        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                      </clipPath>
                      <g clipPath="url(#uk-flag-m)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-diag-m)" stroke="#C8102E" strokeWidth="4" />
                        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                      </g>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 60 40" className="w-full h-full object-cover">
                      <rect width="60" height="40" fill="#032ea1" />
                      <rect y="10" width="60" height="20" fill="#e00025" />
                      <path d="M24,25 h12 v-1 h-1.5 v-5 h-1.5 v5 h-2 v-6 h-2 v6 h-2 v-5 h-1.5 v5 h-1.5 z" fill="#fff" />
                    </svg>
                  )}
                </span>
                <span className="text-[11px] font-extrabold">{language === 'en' ? 'EN' : 'ខ្មែរ'}</span>
              </button>

              {/* Desktop / Tablet Full Language Switcher (sm+) */}
              <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200/80 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                    language === 'en'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Switch to English"
                >
                  <span className="w-3.5 h-2.5 inline-block rounded-xs overflow-hidden shadow-2xs bg-slate-200 shrink-0">
                    <svg viewBox="0 0 60 30" className="w-full h-full object-cover">
                      <clipPath id="uk-flag">
                        <path d="M0,0 v30 h60 v-30 z" />
                      </clipPath>
                      <clipPath id="uk-diag">
                        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
                      </clipPath>
                      <g clipPath="url(#uk-flag)">
                        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
                        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
                        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-diag)" stroke="#C8102E" strokeWidth="4" />
                        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
                        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
                      </g>
                    </svg>
                  </span>
                  <span className="text-[11px]">EN</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('km')}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                    language === 'km'
                      ? 'bg-white text-orange-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="ប្តូរទៅភាសាខ្មែរ"
                >
                  <span className="w-3.5 h-2.5 inline-block rounded-xs overflow-hidden shadow-2xs bg-slate-200 shrink-0">
                    <svg viewBox="0 0 60 40" className="w-full h-full object-cover">
                      <rect width="60" height="40" fill="#032ea1" />
                      <rect y="10" width="60" height="20" fill="#e00025" />
                      <path d="M24,25 h12 v-1 h-1.5 v-5 h-1.5 v5 h-2 v-6 h-2 v6 h-2 v-5 h-1.5 v5 h-1.5 z" fill="#fff" />
                    </svg>
                  </span>
                  <span className="text-[11px]">ខ្មែរ</span>
                </button>
              </div>

              {/* Desktop / Tablet Table Indicator (Hidden on small mobile, visible in sub-bar) */}
              <button
                type="button"
                onClick={handleOpenModal}
                title={t('selectTable')}
                className="hidden sm:inline-flex cursor-pointer transition-transform active:scale-95"
              >
                {table ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold shadow-2xs hover:bg-orange-100/80">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <FiMapPin className="text-orange-600 text-xs shrink-0" />
                    <span className="whitespace-nowrap">{t('tableNumber', { number: table.table_number })}</span>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-full border border-amber-300/80 font-bold flex items-center gap-1 animate-pulse">
                    <FiMapPin className="text-amber-600 text-xs shrink-0" />
                    <span className="whitespace-nowrap">{t('selectTable')}</span>
                  </div>
                )}
              </button>

              {/* Desktop / Tablet Table Bill / Payment Button */}
              {table && (
                <button
                  type="button"
                  onClick={() => setShowBillModal(true)}
                  title={t('tableBill')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-extrabold shadow-xs hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <FiDollarSign className="w-3.5 h-3.5" />
                  <span>{t('callBillButton')}</span>
                </button>
              )}

              {/* Cart Header Button */}
              <Link
                to="/cart"
                className="relative p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 transition-all active:scale-90 hover:scale-105"
                aria-label={t('viewCart')}
              >
                <FiShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {cartItemCount > 0 && (
                  <span
                    key={cartItemCount}
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold rounded-full h-4.5 min-w-4.5 sm:h-5 sm:min-w-5 px-1 flex items-center justify-center shadow-md animate-pop"
                  >
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Smartphone Dedicated Sub-Bar (Visible only on mobile screens <sm) */}
          <div className="sm:hidden pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            {table ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <FiMapPin className="text-orange-600 text-xs shrink-0" />
                  <span>{t('tableNumber', { number: table.table_number })}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBillModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 active:from-amber-600 active:to-orange-600 text-white text-xs font-extrabold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <FiDollarSign className="w-3 h-3" />
                  <span>{t('callBillButton')}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleOpenModal}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1 px-3 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition-all active:scale-95 cursor-pointer animate-pulse"
              >
                <FiMapPin className="text-amber-600 text-xs" />
                <span>{t('selectTable')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Table Selector Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <FiMapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{t('selectYourTable')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {t('tableModalSubtitle')}
            </p>

            <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('tableSharingAllowed')}</span>
            </div>

            {loadingTables ? (
              <div className="py-8 text-center text-xs text-slate-400">{t('loadingTables')}</div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-2.5 max-h-60 sm:max-h-80 overflow-y-auto pr-1">
                {availableTables.map((tbl) => {
                  const isCurrent = table?.id === tbl.id
                  const isOccupied = Boolean(tbl.is_occupied)
                  return (
                    <button
                      key={tbl.id}
                      type="button"
                      onClick={() => handleSelectTable(tbl)}
                      title={isOccupied ? `Table ${tbl.table_number} - Seated (Tap to join)` : `Table ${tbl.table_number} - Available`}
                      className={`p-2 sm:p-2.5 rounded-2xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center gap-1 cursor-pointer relative ${
                        isCurrent
                          ? 'border-orange-500 bg-orange-50 text-orange-600 ring-2 ring-orange-500/20 font-black'
                          : isOccupied
                          ? 'border-amber-300/90 bg-amber-50/60 hover:bg-amber-100 hover:border-amber-400 text-slate-800 font-bold'
                          : 'border-slate-200 bg-slate-50 hover:bg-orange-50/50 hover:border-orange-300 text-slate-800 font-bold'
                      }`}
                    >
                      <span className="text-xs font-black">T-{tbl.table_number}</span>
                      {isCurrent ? (
                        <FiCheck className="w-3.5 h-3.5 text-orange-600" />
                      ) : isOccupied ? (
                        <span className="text-[8px] sm:text-[9px] font-black text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 leading-none">
                          <span>👥</span>
                          <span>{t('tableOccupied')}</span>
                        </span>
                      ) : (
                        <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-full leading-none">
                          {t('tableAvailable')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">{t('orScanQr')}</span>
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="text-slate-600 font-semibold hover:text-slate-900 cursor-pointer"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Bill & Active Orders Modal */}
      {table && (
        <TableBillModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          table={table}
        />
      )}
    </>
  )
}

export default Navbar

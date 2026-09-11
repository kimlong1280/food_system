import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiMapPin,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import { Spinner } from '../../components/Loading'

const Checkout = () => {
  const navigate = useNavigate()
  const {
    table,
    setTableInfo,
    cartItems,
    cartSubtotal,
    customerName,
    setCustomerName,
    orderNote,
    setOrderNote,
    clearCart,
  } = useCart()
  const { t } = useLanguage()

  const [availableTables, setAvailableTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch active tables if no table is selected yet
  useEffect(() => {
    if (!table) {
      const fetchTables = async () => {
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
      fetchTables()
    }
  }, [table])

  if (cartItems.length === 0) {
    navigate('/cart')
    return null
  }

  const handleSelectTable = (selectedTable) => {
    setTableInfo(selectedTable)
    if (selectedTable.is_occupied) {
      toast.success(t('tableJoinedNotice', { number: selectedTable.table_number }), {
        duration: 4500,
        icon: '👥',
      })
    } else {
      toast.success(t('connectedToTable', { number: selectedTable.table_number }))
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()

    if (!table) {
      toast.error(t('selectTableFirstError'))
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        table_id: table.id,
        customer_name: customerName.trim() || null,
        note: orderNote.trim() || null,
        items: cartItems.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          note: item.note ? item.note.trim() : null,
        })),
      }

      const response = await api.post('/orders', payload)
      const createdOrder = response.data.order

      // Clear shopping cart on successful checkout
      clearCart()

      // Save order number to localStorage for persistent live tracking across refreshes
      if (createdOrder?.order_number) {
        localStorage.setItem('restaurant_latest_order', createdOrder.order_number)
        sessionStorage.setItem(`order_status_${createdOrder.order_number}`, 'pending')
      }

      toast.success(t('orderPlacedSuccess'), {
        duration: 4000,
      })

      // Navigate to order confirmation and live tracking
      navigate(`/order-success?order=${createdOrder.order_number}`, {
        state: { order: createdOrder },
        replace: true,
      })
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : t('orderFailed'))

      toast.error(errorMsg, { duration: 5000 })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-4 space-y-5 animate-slide-up">
      {/* Back Button */}
      <button
        onClick={() => navigate('/cart')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200/80 shadow-2xs hover:bg-slate-50 hover:border-orange-300 hover:text-orange-600 transition-all cursor-pointer"
      >
        <FiArrowLeft className="w-3.5 h-3.5" />
        <span>{t('backToCart')}</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">{t('checkoutAndReview')}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('checkoutReviewSub')}
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="lg:grid lg:grid-cols-12 lg:gap-8 items-start space-y-4 lg:space-y-0">
        {/* Left Column: Table and Customer details */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Table Assignment Box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg">
                  <FiMapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{t('diningTable')}</p>
                  <p className="text-base font-extrabold text-slate-900">
                    {table ? t('tableNumber', { number: table.table_number }) : t('whichTableSeated')}
                  </p>
                </div>
              </div>
              {table ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{t('verified')}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1">
                  <FiAlertCircle className="w-3.5 h-3.5" />
                  <span>{t('actionNeeded')}</span>
                </span>
              )}
            </div>

            {/* Quick Table Selection if no table was scanned via QR */}
            {!table && (
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">
                    {t('whichTableSeated')}
                  </p>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                    👥 {t('tableSharingAllowed')}
                  </span>
                </div>
                {loadingTables ? (
                  <p className="text-xs text-slate-400">{t('loadingTables')}</p>
                ) : (
                  <div className="grid grid-cols-3 min-[400px]:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {availableTables.map((tbl) => {
                      const isOccupied = Boolean(tbl.is_occupied)
                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => handleSelectTable(tbl)}
                          title={isOccupied ? `Table ${tbl.table_number} - Seated (Click to join)` : `Table ${tbl.table_number} - Available`}
                          className={`py-2 px-1.5 rounded-xl border text-center font-extrabold text-xs transition-all duration-200 active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                            isOccupied
                              ? 'border-amber-300 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-400 text-amber-950 shadow-2xs'
                              : 'border-slate-200 bg-slate-50 hover:bg-orange-500 hover:text-white hover:border-orange-500 hover:scale-105'
                          }`}
                        >
                          <span>T-{tbl.table_number}</span>
                          {isOccupied ? (
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-200/70 px-1.5 py-0.2 rounded-full leading-none">
                              👥 {t('tableOccupied')}
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-emerald-700 bg-emerald-100/60 px-1 py-0.2 rounded-full leading-none">
                              {t('tableAvailable')}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                <p className="text-[11px] text-slate-500">
                  {t('scanQrPhysicalNotice')}
                </p>
              </div>
            )}

            {table && (
              <div className="pt-2.5 border-t border-slate-100 space-y-2 text-xs">
                {table.is_occupied && (
                  <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <span className="font-medium">
                      {t('tableJoinedNotice', { number: table.table_number })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{table.name || t('dineInArea')}</span>
                  <button
                    type="button"
                    onClick={() => setTableInfo(null)}
                    className="text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
                  >
                    {t('changeTable')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info (Optional) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                <FiUser className="text-orange-500" />
                <span>{t('yourNameOptional')}</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('yourNamePlaceholder')}
                maxLength={60}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                <FiFileText className="text-orange-500" />
                <span>{t('orderNoteKitchen')}</span>
              </label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder={t('orderNotePlaceholder')}
                maxLength={200}
                rows={2}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Order items summary, payment policy, and CTA */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-20">
          {/* Order Summary Breakdown */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('orderItemsSummary')}
            </h3>

            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-start text-xs">
                  <div>
                    <p className="font-bold text-slate-900">
                      {item.name} <span className="text-orange-600 font-extrabold">x{item.quantity}</span>
                    </p>
                    {item.note && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">{t('note')}: {item.note}</p>
                    )}
                  </div>
                  <span className="font-bold text-slate-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>{t('subtotal')}</span>
                <span className="font-semibold text-slate-900">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>{t('totalAmount')}</span>
                <span className="text-orange-600">${cartSubtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Policy Notice */}
          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <i className="fi fi-sr-bell-ring text-base text-amber-600 shrink-0 mt-0.5" />
            <span>{t('tablePaymentNotice')}</span>
          </div>

          {/* Place Order CTA Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting || !table}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed animate-pulse-glow"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="border-white border-t-transparent" />
                  <span>{t('sendingOrder')}</span>
                </>
              ) : !table ? (
                <>
                  <FiAlertCircle className="w-5 h-5" />
                  <span>{t('selectYourTableToOrder')}</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-5 h-5" />
                  <span>{t('placeOrder', { amount: cartSubtotal.toFixed(2) })}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Checkout

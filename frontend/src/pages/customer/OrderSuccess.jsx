import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useParams, useSearchParams, Link } from 'react-router-dom'
import {
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiShoppingBag,
  FiBell,
  FiDollarSign,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import { Spinner } from '../../components/Loading'
import TableBillModal from '../../components/TableBillModal'
import OrderStatusTracker from '../../components/OrderStatusTracker'

const OrderSuccess = () => {
  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const { table } = useCart()
  const { t } = useLanguage()

  // Resolve order number from state, URL params, search params, or localStorage
  const initialOrder = location.state?.order || null
  const orderNumber =
    params.orderNumber ||
    searchParams.get('order') ||
    initialOrder?.order_number ||
    localStorage.getItem('restaurant_latest_order') ||
    null

  const [order, setOrder] = useState(initialOrder)
  const [loading, setLoading] = useState(!initialOrder && Boolean(orderNumber))
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null)
  const [isPaymentRequested, setIsPaymentRequested] = useState(
    Boolean(initialOrder?.is_payment_requested)
  )
  const [requestingPayment, setRequestingPayment] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)

  // Track previous status to notify customer on change
  const previousStatusRef = useRef(initialOrder?.status || null)

  // Fetch latest order details from backend
  const fetchOrder = useCallback(
    async (isManual = false) => {
      if (!orderNumber) return

      if (isManual) setRefreshing(true)

      try {
        const res = await api.get(`/orders/${orderNumber}`)
        const data = res.data?.data || res.data?.order || res.data

        if (data) {
          // Check if status changed
          if (previousStatusRef.current && previousStatusRef.current !== data.status) {
            toast.success(
              t('statusUpdatedToast', {
                number: data.order_number,
                status: data.status.toUpperCase(),
              }),
              {
                duration: 5000,
                icon: '🔔',
              }
            )
          }

          previousStatusRef.current = data.status
          setOrder(data)
          setIsPaymentRequested(Boolean(data.is_payment_requested))
          setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))

          // Save to localStorage as latest order
          localStorage.setItem('restaurant_latest_order', data.order_number)
        }
      } catch (err) {
        console.error('Failed to poll order status:', err)
      } finally {
        setLoading(false)
        if (isManual) setRefreshing(false)
      }
    },
    [orderNumber, t]
  )

  // Initial fetch if we don't have full order object yet
  useEffect(() => {
    if (!initialOrder && orderNumber) {
      fetchOrder()
    } else if (initialOrder) {
      previousStatusRef.current = initialOrder.status
      setLastUpdatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
  }, [initialOrder, orderNumber, fetchOrder])

  // Real-time polling: poll every 4.5 seconds while order is actively in progress
  useEffect(() => {
    if (!orderNumber) return

    // Stop fast polling if order is already completed or cancelled
    if (order?.status === 'completed' || order?.status === 'cancelled') {
      return
    }

    const intervalId = setInterval(() => {
      fetchOrder(false)
    }, 4500)

    return () => clearInterval(intervalId)
  }, [orderNumber, order?.status, fetchOrder])

  // Call bill / request payment
  const handleRequestPayment = async () => {
    if (!order) return
    setRequestingPayment(true)
    try {
      if (order.table_id || table?.id) {
        const targetTableId = order.table_id || table?.id
        await api.post(`/tables/${targetTableId}/request-payment`)
      } else {
        await api.post(`/orders/${order.order_number}/request-payment`)
      }

      setIsPaymentRequested(true)
      toast.success(t('billRequestedSuccess', { number: tableNumber || '' }), {
        duration: 5000,
      })
      // Refresh order
      fetchOrder(false)
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Failed to alert staff. Please try again or notify a waiter directly.'
      toast.error(errorMsg)
    } finally {
      setRequestingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="pt-20 text-center space-y-3">
        <Spinner size="lg" className="text-orange-600" />
        <p className="text-xs text-slate-500 font-bold tracking-wide">
          Connecting to kitchen order tracker...
        </p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="pt-16 text-center max-w-sm mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center text-2xl">
          <FiShoppingBag className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-extrabold text-base text-slate-900">{t('noRecentOrder')}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse our delicious menu and place an order for your table to track its live status.
          </p>
        </div>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-600/25 hover:bg-orange-700 transition-all"
        >
          <span>{t('returnToMenu')}</span>
        </Link>
      </div>
    )
  }

  const tableNumber = order.table_number || order.table?.table_number || table?.table_number

  return (
    <div className="pt-6 pb-12 space-y-6 max-w-md sm:max-w-xl md:max-w-2xl mx-auto animate-slide-up">
      {/* Top Header Badge */}
      <div className="text-center space-y-3">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
          <span className="absolute inset-2 rounded-full bg-emerald-300/30 animate-pulse" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-xl shadow-emerald-500/30 animate-pop">
            <FiCheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>
        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider">
          {t('orderReceived')}
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t('thankYouForOrdering')}
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          {t('orderSuccessMessage')}
        </p>
      </div>

      {/* Real-Time Order Status Tracker Pipeline */}
      <OrderStatusTracker
        order={order}
        onRefresh={() => fetchOrder(true)}
        refreshing={refreshing}
        lastUpdatedTime={lastUpdatedTime}
      />

      {/* Order Ticket Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-lg shadow-slate-200/50 space-y-5 relative overflow-hidden animate-scale-in">
        {/* Ticket Top Cutout Decoration */}
        <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-200">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('orderNumber')}
            </p>
            <p className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight">
              #{order.order_number}
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-extrabold uppercase border border-amber-200">
              {order.status || t('orderStatusPending')}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">
              {order.formatted_time || t('justNow')}
            </p>
          </div>
        </div>

        {/* Table & Guest Information */}
        <div className="grid grid-cols-2 gap-3 py-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <FiMapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">{t('table')}</p>
              <p className="font-bold text-slate-900">
                {t('tableNumber', { number: tableNumber })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FiClock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">{t('service')}</p>
              <p className="font-bold text-slate-900">{t('dineIn')}</p>
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('orderItemsSummary')}
          </h4>
          <div className="divide-y divide-slate-100 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-start">
                <div className="pr-2">
                  <p className="font-bold text-slate-800">
                    {item.item_name} <span className="text-orange-600 font-extrabold">x{item.quantity}</span>
                  </p>
                  {item.note && (
                    <p className="text-[11px] text-slate-400 italic mt-0.5">{t('note')}: {item.note}</p>
                  )}
                </div>
                <span className="font-bold text-slate-900 shrink-0">
                  ${parseFloat(item.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
          <span className="text-sm font-extrabold text-slate-900">{t('totalPaidDue')}</span>
          <span className="text-xl sm:text-2xl font-black text-orange-600">
            ${parseFloat(order.total).toFixed(2)}
          </span>
        </div>

        {/* Telegram Alert Payment Section */}
        <div className="pt-2 space-y-3">
          {isPaymentRequested ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5 animate-slide-up">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FiCheckCircle className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-emerald-900 text-sm">
                    {t('staffOnTheWay', { number: tableNumber })}
                  </p>
                  <p className="text-emerald-700 text-[11px] mt-0.5">
                    {t('billRequestedSuccess', { number: tableNumber })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={requestingPayment}
                onClick={handleRequestPayment}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {requestingPayment ? (
                  <>
                    <Spinner size="sm" className="border-white border-t-transparent" />
                    <span>{t('requestingBill')}</span>
                  </>
                ) : (
                  <>
                    <FiBell className="w-3.5 h-3.5" />
                    <span>{t('requestAgain')}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FiBell className="w-4 h-4 animate-bounce" />
                </div>
                <div className="text-xs">
                  <p className="font-extrabold text-slate-900">
                    {t('tablePaymentNoticeShort')}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Tap below to instantly alert restaurant staff via Telegram to bring your bill and collect payment.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={requestingPayment}
                onClick={handleRequestPayment}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-black text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse-glow"
              >
                {requestingPayment ? (
                  <>
                    <Spinner size="sm" className="border-white border-t-transparent" />
                    <span>{t('requestingBill')}</span>
                  </>
                ) : (
                  <>
                    <FiBell className="w-4 h-4" />
                    <span>{t('requestBill')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* View Full Table Bill & Orders Button */}
          {table && (
            <button
              type="button"
              onClick={() => setShowBillModal(true)}
              className="w-full py-3 px-4 rounded-2xl border border-slate-200/90 hover:border-orange-300 hover:bg-orange-50/50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiDollarSign className="w-4 h-4 text-orange-600" />
              <span>{t('viewTableBill')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Order More Action */}
      <div className="pt-1">
        <Link
          to="/menu"
          className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <FiShoppingBag className="w-4 h-4" />
          <span>{t('orderMoreFoodOrDrinks')}</span>
        </Link>
      </div>

      {/* Table Bill Modal */}
      {table && (
        <TableBillModal
          isOpen={showBillModal}
          onClose={() => setShowBillModal(false)}
          table={table}
          onBillRequested={() => setIsPaymentRequested(true)}
        />
      )}
    </div>
  )
}

export default OrderSuccess

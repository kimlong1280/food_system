import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiX, FiCheckCircle, FiBell, FiRefreshCw, FiClock, FiShoppingBag, FiDollarSign, FiExternalLink } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { Spinner } from './Loading'

const TableBillModal = ({ isOpen, onClose, table, onBillRequested }) => {
  const { t } = useLanguage()
  const [billData, setBillData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const fetchBill = async () => {
    if (!table?.id) return
    if (!billData) setLoading(true)
    try {
      const res = await api.get(`/tables/${table.id}/bill`)
      setBillData(res.data)
    } catch (err) {
      console.error('Failed to load table bill:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || !table?.id) return

    fetchBill()

    // Real-time polling every 5s while modal is open
    const interval = setInterval(() => {
      api
        .get(`/tables/${table.id}/bill`)
        .then((res) => {
          if (res.data) setBillData(res.data)
        })
        .catch(() => {})
    }, 5000)

    return () => clearInterval(interval)
  }, [isOpen, table?.id])

  const handleRequestPayment = async () => {
    if (!table?.id) return
    setRequesting(true)
    try {
      const res = await api.post(`/tables/${table.id}/request-payment`)
      setBillData(res.data.bill)
      toast.success(t('billRequestedSuccess', { number: table.table_number }), {
        duration: 5000,
      })
      if (onBillRequested) {
        onBillRequested(res.data.bill)
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to alert staff. Please try again.')
      toast.error(errorMsg)
    } finally {
      setRequesting(false)
    }
  }

  if (!isOpen) return null

  const isPaymentRequested = billData?.is_payment_requested
  const totalDue = billData?.total_due || 0
  const orders = billData?.orders || []

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'served':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'completed':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/70 to-amber-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 text-lg">
              <FiDollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>{t('tableBill')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold border border-orange-200">
                  {t('tableNumber', { number: table?.table_number })}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {t('activeOrdersForTable', { number: table?.table_number })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={fetchBill}
              disabled={loading}
              className="p-2 rounded-full text-slate-400 hover:text-orange-600 hover:bg-white transition-colors cursor-pointer"
              title="Refresh"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {loading && !billData ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" className="text-orange-600" />
              <p className="text-xs text-slate-400 font-medium">Loading table bill...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <FiShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">{t('noActiveOrders')}</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Items you order for Table {table?.table_number} will show up here along with the total payment amount.
              </p>
            </div>
          ) : (
            <>
              {/* Payment Requested Alert Banner */}
              {isPaymentRequested ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-slide-up">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FiCheckCircle className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-extrabold text-emerald-900">
                      {t('staffOnTheWay', { number: table?.table_number })}
                    </p>
                    <p className="text-emerald-700 text-[11px]">
                      A waiter has received your bill request via Telegram and is bringing your bill to Table {table?.table_number}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800">
                  <FiBell className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                  <span>{t('tablePaymentNoticeShort')}</span>
                </div>
              )}

              {/* Active Orders List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    {t('allActiveOrdersSummary')} ({orders.length})
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    {t('itemsCount', { count: billData?.items_count || 0 })}
                  </span>
                </div>

                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900">
                            #{order.order_number}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase border ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/orders/${order.order_number}`}
                            onClick={onClose}
                            className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                          >
                            <span>{t('trackOrder')}</span>
                            <FiExternalLink className="w-2.5 h-2.5" />
                          </Link>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 hidden xs:flex">
                            <FiClock className="w-3 h-3" />
                            <span>{order.formatted_time || 'Just now'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items in this order */}
                      <div className="space-y-1.5 text-xs">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {item.item_name}{' '}
                                <span className="font-bold text-orange-600">x{item.quantity}</span>
                              </p>
                              {item.note && (
                                <p className="text-[10px] text-slate-400 italic truncate">
                                  {item.note}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-slate-900 shrink-0">
                              ${item.subtotal.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1.5 flex justify-between items-center text-xs font-bold border-t border-slate-200/60">
                        <span className="text-slate-500">{t('orderTotal')}</span>
                        <span className="text-slate-900 font-extrabold">
                          ${parseFloat(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with Total Due and Request Payment Button */}
        {orders.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/90 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  {t('totalPaymentDue')}
                </p>
                <p className="text-2xl font-black text-orange-600 tracking-tight">
                  ${totalDue.toFixed(2)}
                </p>
              </div>

              {isPaymentRequested && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>{t('paymentRequestedBadge')}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={requesting}
              onClick={handleRequestPayment}
              className={`w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                isPaymentRequested
                  ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-800/20'
                  : 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white shadow-orange-500/25 animate-pulse-glow'
              }`}
            >
              {requesting ? (
                <>
                  <Spinner size="sm" className="border-white border-t-transparent" />
                  <span>{t('requestingBill')}</span>
                </>
              ) : isPaymentRequested ? (
                <>
                  <FiBell className="w-4 h-4" />
                  <span>{t('requestAgain')}</span>
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
      </div>
    </div>
  )
}

export default TableBillModal

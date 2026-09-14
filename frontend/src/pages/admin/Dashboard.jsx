import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
  FiArrowRight,
  FiRefreshCw,
  FiAlertCircle,
  FiPlus,
  FiMapPin,
  FiSearch,
  FiX,
  FiEye,
  FiCheck,
  FiBell,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import StatsCard from '../../components/admin/StatsCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { PageLoading, Spinner } from '../../components/Loading'
import { useLanguage } from '../../context/LanguageContext'

const Dashboard = () => {
  const { t } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  // Filtering & Search
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Live Cambodia Time
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date()
        setCurrentTime(
          now.toLocaleTimeString('en-US', {
            timeZone: 'Asia/Phnom_Penh',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        )
      } catch {
        setCurrentTime(new Date().toLocaleTimeString())
      }
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchDashboardStats = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await api.get('/admin/dashboard')
      setData(res.data)
      if (isManual) toast.success(t('dashboardMetricsUpdated'))
    } catch {
      toast.error(t('failedLoadStats'))
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()

    // Polling every 20 seconds for real-time kitchen updates
    const timer = setInterval(() => {
      fetchDashboardStats()
    }, 20000)

    return () => clearInterval(timer)
  }, [])

  // Quick order status update
  const handleQuickStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus })
      toast.success(t('orderStatusUpdated', { id: orderId, status: t(`status${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`) || newStatus.toUpperCase() }))
      await fetchDashboardStats()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('failedUpdateStatus'))
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtered orders list based on status filter and search input
  const filteredOrders = useMemo(() => {
    if (!data?.recent_orders) return []

    return data.recent_orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase()

      const query = searchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        order.order_number?.toLowerCase().includes(query) ||
        String(order.table_number || '').toLowerCase().includes(query) ||
        order.customer_name?.toLowerCase().includes(query)

      return matchesStatus && matchesQuery
    })
  }, [data?.recent_orders, statusFilter, searchQuery])

  // Count active pending and preparing orders
  const activeKitchenCount = (data?.pending_orders || 0) + (data?.preparing_orders || 0)

  if (loading) return <PageLoading text={t('loading')} />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Management Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('restaurantAdmin')}
            </h1>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 hidden sm:inline">
              {t('kitchenLive')}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span>{t('cambodiaTime')}:</span>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {currentTime || '--:--:--'}
            </span>
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/menu-items"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm shadow-orange-600/20 active:scale-95 transition-all"
          >
            <FiPlus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t('newMenuItem')}</span>
          </Link>

          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm shadow-slate-900/10 active:scale-95 transition-all"
          >
            <FiShoppingBag className="w-3.5 h-3.5" />
            <span>{t('navOrders')}</span>
            {activeKitchenCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[10px] font-black animate-pulse">
                {activeKitchenCount}
              </span>
            )}
          </Link>

          <Link
            to="/admin/tables"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold shadow-2xs active:scale-95 transition-all"
          >
            <FiMapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('navTables')}</span>
          </Link>

          <button
            onClick={() => fetchDashboardStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title={t('refreshStats')}
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Today's Revenue with Dual USD & KHR */}
        <StatsCard
          title={t('todayRevenue')}
          value={data?.formatted_today_revenue || '$0.00'}
          khrValue={data?.formatted_today_revenue_khr}
          subtext={`All-time: ${data?.formatted_total_revenue || '$0.00'} (${data?.formatted_total_revenue_khr || '0 ៛'})`}
          icon={<FiDollarSign />}
          color="purple"
        />

        {/* Active Kitchen Orders */}
        <StatsCard
          title={t('pendingKitchen')}
          value={activeKitchenCount}
          badge={data?.pending_orders > 0 ? `${data.pending_orders} ${t('statusPending')}` : t('statusPreparing')}
          subtext={`${data?.preparing_orders || 0} ${t('statusPreparing')}, ${data?.ready_orders || 0} ${t('statusReady')}`}
          icon={<FiClock />}
          color="orange"
        />

        {/* Completed Orders */}
        <StatsCard
          title={t('completedOrders')}
          value={data?.completed_orders || 0}
          subtext={`Total: ${data?.total_orders || 0}`}
          icon={<FiCheckCircle />}
          color="emerald"
        />

        {/* Table Occupancy */}
        <StatsCard
          title={t('tablesTitle')}
          value={`${data?.active_tables || 0} / ${data?.total_tables || 0}`}
          badge={
            data?.total_tables > 0
              ? `${Math.round(((data?.active_tables || 0) / data.total_tables) * 100)}% ${t('statusOccupied')}`
              : '0%'
          }
          subtext={`${(data?.total_tables || 0) - (data?.active_tables || 0)} ${t('statusAvailable')}`}
          icon={<FiMapPin />}
          color="blue"
        />
      </div>

      {/* Priority Action Banners (Bill Requests & Sold Out Alerts) */}
      <div className="space-y-3">
        {/* Bill Payment Call Request Alert Banner */}
        {data?.bill_requested_count > 0 && (
          <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-3xl shadow-lg shadow-orange-500/20 flex flex-wrap items-center justify-between gap-3 animate-pulse-glow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shrink-0">
                <FiBell className="w-5 h-5 text-white animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight">
                  {data.bill_requested_count} {t('billRequestedSuccess').split('!')[0]}
                </h3>
                <p className="text-xs text-white/90">
                  {t('staffOnTheWay', { number: '' })}
                </p>
              </div>
            </div>
            <Link
              to="/admin/orders?status=bill"
              className="px-4 py-2 bg-white text-orange-950 font-black text-xs rounded-xl hover:bg-orange-50 transition-all shadow-sm"
            >
              {t('printBill')} &rarr;
            </Link>
          </div>
        )}

        {/* Sold Out / Unavailable Notice */}
        {data?.unavailable_items_count > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {data.unavailable_items_count} {t('soldOut')}
              </span>
            </div>
            <Link
              to="/admin/menu-items"
              className="font-extrabold underline text-amber-950 hover:text-orange-600"
            >
              {t('edit')}
            </Link>
          </div>
        )}
      </div>

      {/* Main Grid: Orders Table (2 Columns) & Side Widgets (1 Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live Orders Management Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">{t('liveOrders')}</h2>
              <p className="text-xs text-slate-500">{t('liveOrderFeed')}</p>
            </div>

            {/* Live Search Filter */}
            <div className="relative w-full sm:w-56">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={t('searchOrdersPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { key: 'all', label: t('allOrders') },
              { key: 'pending', label: t('filterPending') },
              { key: 'preparing', label: t('filterPreparing') },
              { key: 'ready', label: t('filterReady') },
              { key: 'completed', label: t('filterCompleted') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile View: Thumb-Friendly Order Cards */}
          <div className="block md:hidden space-y-3">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const isBusy = updatingId === order.id
                const isBillRequested = order.is_payment_requested && order.status !== 'completed'

                return (
                  <div
                    key={order.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isBillRequested
                        ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/40'
                        : order.status === 'pending'
                        ? 'border-orange-300 ring-1 ring-orange-300/30 bg-orange-50/20'
                        : 'border-slate-200/80 bg-slate-50/50'
                    }`}
                  >
                    {/* Top: Table & Order # & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-orange-600 text-white font-black text-xs">
                          {t('tableNumber', { number: order.table_number || 'N/A' })}
                        </span>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="font-bold text-xs text-slate-800 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
                        >
                          <span>#{order.order_number}</span>
                          <FiEye className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusBadge status={order.status} />
                        {isBillRequested && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white animate-pulse">
                            🔔 {t('statusBillRequested')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time & Customer */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{order.customer_name ? `${t('customerCol')}: ${order.customer_name}` : t('anonymousDiner')}</span>
                      <span className="text-[11px] text-slate-400">{order.formatted_time}</span>
                    </div>

                    {/* Price & Action Button */}
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900">{order.formatted_total}</span>
                        <span className="text-[10px] text-orange-600 font-bold ml-1">({order.formatted_total_khr})</span>
                      </div>

                      {/* Quick 1-tap Status Advance */}
                      <div>
                        {isBusy ? (
                          <Spinner size="sm" className="inline-block text-orange-600" />
                        ) : order.status === 'pending' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'preparing')}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-transform"
                          >
                            👨‍🍳 {t('startCooking')}
                          </button>
                        ) : order.status === 'preparing' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'ready')}
                            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-transform"
                          >
                            🔔 {t('markReady')}
                          </button>
                        ) : order.status === 'ready' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'served')}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-transform"
                          >
                            🍽️ {t('deliverOrder')}
                          </button>
                        ) : order.status === 'served' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'completed')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer active:scale-95 transition-transform flex items-center gap-1"
                          >
                            <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{t('completeOrder')}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            {t('viewDetails')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-6 text-center text-slate-400 space-y-1">
                <FiShoppingBag className="w-5 h-5 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-500">{t('noOrdersFound')}</p>
              </div>
            )}
          </div>

          {/* Desktop View: Table Container */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left text-xs min-w-[580px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-extrabold">{t('orderNumberCol')}</th>
                  <th className="pb-3 font-extrabold">{t('tableCol')}</th>
                  <th className="pb-3 font-extrabold">{t('totalCol')} (USD / KHR)</th>
                  <th className="pb-3 font-extrabold">{t('timeCol')}</th>
                  <th className="pb-3 font-extrabold">{t('statusCol')}</th>
                  <th className="pb-3 font-extrabold text-right">{t('actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const isBusy = updatingId === order.id
                    const isBillRequested = order.is_payment_requested && order.status !== 'completed'

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Order Number */}
                        <td className="py-3 font-black text-slate-900">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="hover:text-orange-600 cursor-pointer flex items-center gap-1"
                            title={t('viewDetails')}
                          >
                            <span>#{order.order_number}</span>
                            <FiEye className="w-3 h-3 text-slate-400" />
                          </button>
                          {order.customer_name && (
                            <span className="block text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                              {order.customer_name}
                            </span>
                          )}
                        </td>

                        {/* Table */}
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                            <FiMapPin className="w-3 h-3 text-slate-500" />
                            <span>{t('tableNumber', { number: order.table_number || 'N/A' })}</span>
                          </span>
                        </td>

                        {/* Total in USD and KHR */}
                        <td className="py-3">
                          <p className="font-extrabold text-orange-600">{order.formatted_total}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{order.formatted_total_khr}</p>
                        </td>

                        {/* Time */}
                        <td className="py-3 text-slate-500 whitespace-nowrap">
                          {order.formatted_time}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3">
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={order.status} />
                            {isBillRequested && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-white animate-pulse">
                                🔔 {t('statusBillRequested')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Quick Status Progression Button */}
                        <td className="py-3 text-right">
                          {isBusy ? (
                            <Spinner size="sm" className="inline-block text-orange-600" />
                          ) : order.status === 'pending' ? (
                            <button
                              onClick={() => handleQuickStatusUpdate(order.id, 'preparing')}
                              className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black shadow-xs cursor-pointer transition-all active:scale-95"
                              title={t('startCooking')}
                            >
                              {t('startCooking')}
                            </button>
                          ) : order.status === 'preparing' ? (
                            <button
                              onClick={() => handleQuickStatusUpdate(order.id, 'ready')}
                              className="px-3 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-black shadow-xs cursor-pointer transition-all active:scale-95"
                              title={t('markReady')}
                            >
                              {t('markReady')}
                            </button>
                          ) : order.status === 'ready' ? (
                            <button
                              onClick={() => handleQuickStatusUpdate(order.id, 'served')}
                              className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black shadow-xs cursor-pointer transition-all active:scale-95"
                              title={t('deliverOrder')}
                            >
                              {t('deliverOrder')}
                            </button>
                          ) : order.status === 'served' ? (
                            <button
                              onClick={() => handleQuickStatusUpdate(order.id, 'completed')}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-xs cursor-pointer transition-all active:scale-95"
                              title={t('completeOrder')}
                            >
                              {t('completeOrder')}
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              {t('viewDetails')}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 space-y-1">
                      <FiShoppingBag className="w-6 h-6 mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-500">{t('noOrdersFound')}</p>
                      <p className="text-[11px] text-slate-400">{t('noOrdersFoundDesc')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-between items-center text-xs text-slate-500 border-t border-slate-100">
            <span>{filteredOrders.length} {t('items')}</span>
            <Link
              to="/admin/orders"
              className="font-extrabold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              <span>{t('allOrders')}</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right 1 Column: Visual Tables Map & Popular Dishes */}
        <div className="space-y-6">
          {/* Tables Status Snapshot Grid */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">{t('tablesTitle')}</h2>
                <p className="text-xs text-slate-500">{t('liveKitchenPulse')}</p>
              </div>
              <Link
                to="/admin/tables"
                className="text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                {t('navTables')} &rarr;
              </Link>
            </div>

            {/* Quick Floor Grid */}
            <div className="grid grid-cols-4 gap-2">
              {data?.tables?.length > 0 ? (
                data.tables.map((tbl) => (
                  <Link
                    key={tbl.id}
                    to={`/admin/orders?table=${tbl.table_number}`}
                    className={`p-2 rounded-2xl border text-center transition-all hover:scale-105 ${
                      tbl.is_occupied
                        ? 'bg-orange-50 border-orange-300 text-orange-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200/80 text-slate-600'
                    }`}
                    title={`Table ${tbl.table_number} (${tbl.is_occupied ? t('statusOccupied') : t('statusAvailable')})`}
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full mb-1 ${
                        tbl.is_occupied ? 'bg-orange-500 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                    <p className="font-black text-xs">T-{tbl.table_number}</p>
                    <p className="text-[9px] text-slate-400">{tbl.capacity}p</p>
                  </Link>
                ))
              ) : (
                <p className="col-span-4 text-center text-xs text-slate-400 py-4">
                  {t('noRecentOrders')}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] pt-1 text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{t('statusAvailable')} ({data?.total_tables - (data?.active_tables || 0)})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="font-bold text-slate-700">{t('statusOccupied')} ({data?.active_tables || 0})</span>
              </span>
            </div>
          </div>

          {/* Popular Dishes Widget */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">{t('popularDishes')}</h2>
                <p className="text-xs text-slate-500">{t('chefSpecial')}</p>
              </div>
              <Link
                to="/admin/menu-items"
                className="text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                {t('navMenuItems')} &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {data?.popular_items?.length > 0 ? (
                data.popular_items.map((entry, idx) => (
                  <div
                    key={entry.item.id}
                    className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                  >
                    <span className="w-5 text-center font-black text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-100">
                      <img
                        src={entry.item.image || '/placeholder-food.png'}
                        alt={entry.item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-xs text-slate-900 truncate">
                        {entry.item.name}
                      </p>
                      <p className="text-[11px] text-orange-600 font-bold">
                        {entry.item.formatted_price}
                        <span className="text-[10px] text-slate-400 ml-1 font-medium">
                          ({entry.item.formatted_price_khr})
                        </span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-xs font-black text-slate-700 shadow-2xs">
                        {entry.total_ordered} {t('items')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  {t('noRecentOrders')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-slate-900">
                    {t('orderDetails', { number: selectedOrder.order_number })}
                  </h3>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('tableNumber', { number: selectedOrder.table_number || 'N/A' })} • {selectedOrder.formatted_time}, {selectedOrder.formatted_date}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Guest & Notes Info */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1 text-xs">
              {selectedOrder.customer_name && (
                <p>
                  <span className="font-bold text-slate-500">{t('customerCol')}: </span>
                  <span className="font-extrabold text-slate-900">{selectedOrder.customer_name}</span>
                </p>
              )}
              {selectedOrder.note && (
                <p>
                  <span className="font-bold text-slate-500">{t('customerNote')}: </span>
                  <span className="italic text-slate-700">{selectedOrder.note}</span>
                </p>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {t('orderedItems', { count: selectedOrder.items?.length || 0 })}
              </h4>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-slate-800">
                        {item.item_name} <span className="text-orange-600 font-extrabold">x{item.quantity}</span>
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">{t('note')}: {item.note}</p>
                      )}
                    </div>
                    <span className="font-black text-slate-900">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-400">{t('totalAmount')}</p>
                <p className="text-xs font-bold text-slate-500">
                  {selectedOrder.formatted_total_khr}
                </p>
              </div>
              <span className="text-2xl font-black text-orange-600">
                {selectedOrder.formatted_total}
              </span>
            </div>

            {/* Advance Status Controls */}
            <div className="pt-2 flex flex-wrap gap-2 justify-end">
              {selectedOrder.status !== 'preparing' && selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => handleQuickStatusUpdate(selectedOrder.id, 'preparing')}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  {t('startCooking')}
                </button>
              )}
              {selectedOrder.status !== 'ready' && selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => handleQuickStatusUpdate(selectedOrder.id, 'ready')}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs cursor-pointer active:scale-95 transition-transform"
                >
                  {t('markReady')}
                </button>
              )}
              {selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => handleQuickStatusUpdate(selectedOrder.id, 'completed')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <FiCheck className="w-4 h-4 stroke-[3]" />
                  <span>{t('completeOrder')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

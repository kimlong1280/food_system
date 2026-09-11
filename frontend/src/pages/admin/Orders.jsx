import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiRefreshCw,
  FiMapPin,
  FiClock,
  FiUser,
  FiFileText,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
  FiRadio,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import StatusBadge from '../../components/admin/StatusBadge'
import Modal from '../../components/admin/Modal'
import { PageLoading } from '../../components/Loading'

const Orders = () => {
  const [searchParams] = useSearchParams()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [lastSyncedTime, setLastSyncedTime] = useState(new Date())

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [dateFilter, setDateFilter] = useState('')

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [expandedOrderIds, setExpandedOrderIds] = useState({})

  const toggleExpand = (id) => {
    setExpandedOrderIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const fetchOrders = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const params = { per_page: 50 }
      if (statusFilter && statusFilter !== 'all' && statusFilter !== 'bill') {
        params.status = statusFilter
      }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (dateFilter) params.date = dateFilter

      const res = await api.get('/admin/orders', { params })
      setOrders(res.data.data || [])
      setLastSyncedTime(new Date())
      if (isManual) toast.success('Orders refreshed!')
    } catch {
      toast.error('Failed to load orders.')
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }, [statusFilter, searchQuery, dateFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Live Auto-Sync every 10 seconds for active smartphone management
  useEffect(() => {
    if (!autoSync) return
    const interval = setInterval(() => {
      fetchOrders(false)
    }, 10000)
    return () => clearInterval(interval)
  }, [autoSync, fetchOrders])

  const handleUpdateStatus = async (orderId, newStatus) => {
    setStatusUpdating(true)
    try {
      const res = await api.put(`/admin/orders/${orderId}/status`, { status: newStatus })
      const updatedOrder = res.data.order

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder)
      }

      toast.success(`Order status updated to "${newStatus}"!`)
    } catch {
      toast.error('Failed to update status.')
    } finally {
      setStatusUpdating(false)
    }
  }

  // Filter orders client-side for special bill filter or combined search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter === 'bill') {
        return (
          order.is_payment_requested &&
          order.status !== 'completed' &&
          order.status !== 'cancelled'
        )
      }
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const orderNum = String(order.order_number || '').toLowerCase()
        const customer = String(order.customer_name || '').toLowerCase()
        const tableNum = String(order.table_number || '').toLowerCase()
        if (
          !orderNum.includes(query) &&
          !customer.includes(query) &&
          !tableNum.includes(query)
        ) {
          return false
        }
      }
      return true
    })
  }, [orders, statusFilter, searchQuery])

  // Real-time status counts for quick chips
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      served: orders.filter((o) => o.status === 'served').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
      bill: orders.filter(
        (o) =>
          o.is_payment_requested &&
          o.status !== 'completed' &&
          o.status !== 'cancelled'
      ).length,
    }
  }, [orders])

  const statuses = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'pending', label: 'Pending', count: counts.pending, alert: counts.pending > 0 },
    { id: 'preparing', label: 'Cooking', count: counts.preparing },
    { id: 'ready', label: 'Ready', count: counts.ready, alert: counts.ready > 0 },
    { id: 'served', label: 'Served', count: counts.served },
    { id: 'bill', label: '🔔 Bill Calls', count: counts.bill, alert: counts.bill > 0, highlight: true },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ]

  if (loading) return <PageLoading text="Fetching orders..." />

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Auto-Sync and Mobile Ergonomics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Live Orders
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time smartphone & kitchen order confirmation and status tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Auto-Sync Toggle Pill */}
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              autoSync
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
            title="Toggle live 10s auto-refresh"
          >
            <span className={`w-2 h-2 rounded-full ${autoSync ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            <span>{autoSync ? 'Live Sync (10s)' : 'Sync Paused'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer active:scale-95 transition-all"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs with Live Badges (Horizontal scroll on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
        {statuses.map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold tracking-wide transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === st.id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                : st.highlight && st.count > 0
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{st.label}</span>
            {st.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  statusFilter === st.id
                    ? 'bg-white/30 text-white'
                    : st.alert
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {st.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search and Date Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <FiSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search by Table #, Order # or Customer..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (Smartphone screens < 768px): Thumb-Friendly Smart Order Cards */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const isBillRequested =
              order.is_payment_requested &&
              order.status !== 'completed' &&
              order.status !== 'cancelled'
            const isExpanded = expandedOrderIds[order.id]
            const items = order.items || []
            const displayedItems = isExpanded ? items : items.slice(0, 3)

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-4 border transition-all shadow-xs space-y-3 ${
                  isBillRequested
                    ? 'border-amber-400 ring-2 ring-amber-400/40 bg-gradient-to-b from-amber-50/50 to-white'
                    : order.status === 'pending'
                    ? 'border-orange-400 ring-2 ring-orange-400/30'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Top Row: Table Pill, Order #, Status Badge */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-600 text-white font-black text-xs shadow-2xs">
                      <FiMapPin className="w-3.5 h-3.5" />
                      <span>Table {order.table_number || order.table?.table_number || 'N/A'}</span>
                    </span>
                    <span className="font-extrabold text-xs text-slate-900">
                      #{order.order_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={order.status} />
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-orange-600 active:scale-95 cursor-pointer"
                      title="View Details"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Urgent Bill Request Callout */}
                {isBillRequested && (
                  <div className="p-3 rounded-2xl bg-amber-500 text-white flex items-center justify-between shadow-sm animate-pulse">
                    <div className="flex items-center gap-2 text-xs font-black">
                      <span className="text-base">🔔</span>
                      <span>Guest Calling for Bill!</span>
                    </div>
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      disabled={statusUpdating}
                      className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 font-black text-xs shadow-xs active:scale-95 hover:bg-emerald-50 cursor-pointer flex items-center gap-1"
                    >
                      <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Confirm Paid</span>
                    </button>
                  </div>
                )}

                {/* Customer & Time Info */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <FiUser className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-700">
                      {order.customer_name || 'Guest (Dine-in)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <FiClock className="w-3 h-3" />
                    <span>{order.formatted_time || order.created_at?.slice(11, 16)}</span>
                  </div>
                </div>

                {/* Kitchen Special Note */}
                {order.note && (
                  <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 font-medium">
                    <span className="font-bold">📝 Kitchen Note: </span>
                    <span>{order.note}</span>
                  </div>
                )}

                {/* Items List (Direct Preview on Card) */}
                <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                  {displayedItems.length > 0 ? (
                    displayedItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 truncate">
                            {item.item_name}{' '}
                            <span className="text-orange-600 font-black">x{item.quantity}</span>
                          </p>
                          {item.note && (
                            <p className="text-[10px] text-slate-400 italic">Note: {item.note}</p>
                          )}
                        </div>
                        <span className="font-extrabold text-slate-900 shrink-0">
                          ${parseFloat(item.subtotal || item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      {order.items_count || 1} items ordered
                    </p>
                  )}

                  {items.length > 3 && (
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full text-center pt-1.5 text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Show less' : `+${items.length - 3} more items`}</span>
                      {isExpanded ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Price & Thumb Action Buttons */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Total Amount
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-900">
                          {order.formatted_total}
                        </span>
                        <span className="text-xs font-extrabold text-orange-600">
                          ({order.formatted_total_khr})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {items.length || order.items_count || 1} items
                    </span>
                  </div>

                  {/* 1-Tap Thumb Action Buttons (min 44px height for mobile ergonomics) */}
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                          disabled={statusUpdating}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FiCheck className="w-4 h-4 stroke-[3]" />
                          <span>Confirm</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          disabled={statusUpdating}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>👨‍🍳 Cook</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          disabled={statusUpdating}
                          className="py-2.5 px-3 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs active:scale-95 transition-transform cursor-pointer"
                          title="Reject order"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {order.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          disabled={statusUpdating}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>👨‍🍳 Start Cooking</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Ticket
                        </button>
                      </>
                    )}

                    {order.status === 'preparing' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          disabled={statusUpdating}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>🔔 Food is Ready</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Ticket
                        </button>
                      </>
                    )}

                    {order.status === 'ready' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'served')}
                          disabled={statusUpdating}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>🍽️ Mark Served</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Ticket
                        </button>
                      </>
                    )}

                    {order.status === 'served' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          disabled={statusUpdating}
                          className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs active:scale-95 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FiCheck className="w-4 h-4 stroke-[3]" />
                          <span>Collect Bill & Finish</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          Ticket
                        </button>
                      </>
                    )}

                    {order.status === 'completed' && (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Completed & Settled</span>
                        </span>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          View Ticket
                        </button>
                      </div>
                    )}

                    {order.status === 'cancelled' && (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-500">
                          Cancelled Order
                        </span>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          View Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200/80 space-y-1">
            <FiAlertCircle className="w-7 h-7 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">No matching orders</p>
            <p className="text-xs text-slate-400">Try switching the status tab or clearing search.</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Screens >= 768px): Full Tabular Management */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">Order #</th>
                <th className="py-3.5 px-4 font-bold">Table</th>
                <th className="py-3.5 px-4 font-bold">Customer</th>
                <th className="py-3.5 px-4 font-bold">Items Count</th>
                <th className="py-3.5 px-4 font-bold">Total (USD / KHR)</th>
                <th className="py-3.5 px-4 font-bold">Time</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const isBillRequested =
                    order.is_payment_requested &&
                    order.status !== 'completed' &&
                    order.status !== 'cancelled'

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="hover:text-orange-600 flex items-center gap-1 cursor-pointer"
                          title="View order ticket"
                        >
                          <span>#{order.order_number}</span>
                          <FiEye className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 font-bold text-xs border border-orange-200">
                          <FiMapPin className="w-3 h-3" />
                          <span>Table {order.table_number || order.table?.table_number || 'N/A'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {order.customer_name || <span className="text-slate-400 italic">Guest</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {order.items?.length || order.items_count || 1} items
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900 block">{order.formatted_total}</span>
                        <span className="text-[10px] text-orange-600 font-bold block">{order.formatted_total_khr}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {order.formatted_time || order.created_at?.slice(11, 16)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={order.status} />
                          {isBillRequested && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                              🔔 Bill Requested
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {/* 1-Click Status Quick Advance Button */}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            disabled={statusUpdating}
                            className="px-2.5 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer"
                          >
                            Cook
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready')}
                            disabled={statusUpdating}
                            className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer"
                          >
                            Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'served')}
                            disabled={statusUpdating}
                            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer"
                          >
                            Served
                          </button>
                        )}
                        {order.status === 'served' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            disabled={statusUpdating}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer"
                          >
                            Paid
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold transition-colors inline-flex items-center gap-1 text-[11px] cursor-pointer"
                          title="View Details"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>

                        {/* Dropdown for custom override */}
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={statusUpdating}
                          className="py-1 px-2 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-hidden focus:border-orange-500 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="served">Served</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No orders found matching your selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.order_number}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            {/* Header Status & Table */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <FiMapPin className="text-orange-600 w-4 h-4" />
                <span className="font-extrabold text-slate-900 text-sm">
                  Table {selectedOrder.table_number || selectedOrder.table?.table_number || 'N/A'}
                </span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {selectedOrder.is_payment_requested && selectedOrder.status !== 'completed' && (
              <div className="p-3 bg-amber-500 text-white rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs">
                <span className="flex items-center gap-1.5">
                  🔔 Guest requested bill payment!
                </span>
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                  className="px-2.5 py-1 bg-white text-emerald-800 rounded-xl font-black text-xs cursor-pointer shadow-xs"
                >
                  Confirm Paid
                </button>
              </div>
            )}

            {/* Customer & Time Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Customer</p>
                <p className="font-bold text-slate-800 truncate">
                  {selectedOrder.customer_name || 'Guest (Dine-in)'}
                </p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Order Time</p>
                <p className="font-bold text-slate-800">
                  {selectedOrder.formatted_time || 'Recent'} ({selectedOrder.formatted_date || 'Today'})
                </p>
              </div>
            </div>

            {/* Special Order Note */}
            {selectedOrder.note && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900">
                <p className="font-bold mb-0.5 flex items-center gap-1.5">
                  <FiFileText className="text-amber-600" />
                  <span>Customer Note:</span>
                </p>
                <p className="italic">{selectedOrder.note}</p>
              </div>
            )}

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ordered Items ({selectedOrder.items?.length || selectedOrder.items_count || 0})
              </h4>
              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl p-3 max-h-52 overflow-y-auto">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-2 flex justify-between items-start text-xs">
                    <div>
                      <p className="font-extrabold text-slate-900">
                        {item.item_name}{' '}
                        <span className="text-orange-600 font-black">x{item.quantity}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ${parseFloat(item.price).toFixed(2)} each
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1 font-medium">
                          Note: {item.note}
                        </p>
                      )}
                    </div>
                    <span className="font-black text-slate-900">
                      ${parseFloat(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount (USD & KHR) */}
            <div className="flex justify-between items-center p-3.5 bg-orange-50/70 rounded-2xl border border-orange-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                <span className="text-xs font-bold text-slate-500">{selectedOrder.formatted_total_khr}</span>
              </div>
              <span className="text-xl font-black text-orange-600">
                {selectedOrder.formatted_total}
              </span>
            </div>

            {/* Status Change Buttons Pipeline (Thumb-friendly grid) */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Change Status:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'confirmed', label: 'Confirm', color: 'bg-blue-600' },
                  { key: 'preparing', label: 'Cooking', color: 'bg-purple-600' },
                  { key: 'ready', label: 'Ready', color: 'bg-teal-600' },
                  { key: 'served', label: 'Served', color: 'bg-indigo-600' },
                  { key: 'completed', label: 'Paid & Done', color: 'bg-emerald-600' },
                  { key: 'cancelled', label: 'Cancel', color: 'bg-rose-600' },
                ].map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => handleUpdateStatus(selectedOrder.id, action.key)}
                    disabled={selectedOrder.status === action.key || statusUpdating}
                    className={`p-2.5 rounded-xl text-white text-xs font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-30 cursor-pointer ${action.color}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Orders

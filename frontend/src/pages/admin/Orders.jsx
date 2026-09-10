import { useState, useEffect, useCallback } from 'react'
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

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [dateFilter, setDateFilter] = useState('')

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const fetchOrders = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const params = {}
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (dateFilter) params.date = dateFilter

      const res = await api.get('/admin/orders', { params })
      setOrders(res.data.data || [])
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

      toast.success(`Order status changed to "${newStatus}"!`)
    } catch {
      toast.error('Failed to update status.')
    } finally {
      setStatusUpdating(false)
    }
  }

  const statuses = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
    { id: 'served', label: 'Served' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  if (loading) return <PageLoading text="Fetching orders..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, confirm, and update restaurant customer orders.
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
        {statuses.map((st) => (
          <button
            key={st.id}
            onClick={() => setStatusFilter(st.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 shrink-0 ${
              statusFilter === st.id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Search and Date Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <FiSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order # or Customer Name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          />
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">Order #</th>
                <th className="py-3.5 px-4 font-bold">Table</th>
                <th className="py-3.5 px-4 font-bold">Customer</th>
                <th className="py-3.5 px-4 font-bold">Items Count</th>
                <th className="py-3.5 px-4 font-bold">Total</th>
                <th className="py-3.5 px-4 font-bold">Time</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-extrabold text-slate-900">
                      #{order.order_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      Table {order.table_number || order.table?.table_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {order.customer_name || <span className="text-slate-400 italic">Guest</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {order.items?.length || order.items_count || 1} items
                    </td>
                    <td className="py-3 px-4 font-black text-orange-600">
                      {order.formatted_total}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {order.formatted_time || order.created_at?.slice(11, 16)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={order.status} />
                        {order.is_payment_requested && order.status !== 'completed' && order.status !== 'cancelled' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 animate-pulse">
                            🔔 Bill Requested
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold transition-colors inline-flex items-center gap-1 text-[11px]"
                        title="View Details"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      {/* Status Dropdown Quick Selector */}
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        disabled={statusUpdating}
                        className="py-1 px-2 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-hidden focus:border-orange-500 cursor-pointer"
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
                ))
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
          <div className="space-y-5">
            {/* Header Status & Table */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2">
                <FiMapPin className="text-orange-600 w-4 h-4" />
                <span className="font-extrabold text-slate-900 text-sm">
                  Table {selectedOrder.table_number || selectedOrder.table?.table_number}
                </span>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {selectedOrder.is_payment_requested && selectedOrder.status !== 'completed' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                <span className="font-bold flex items-center gap-1.5">
                  🔔 Customer requested bill / payment alert via Telegram
                </span>
                <span className="text-[10px] font-semibold text-emerald-600">
                  {selectedOrder.formatted_payment_requested_time || 'Pending Staff'}
                </span>
              </div>
            )}

            {/* Customer & Time Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <FiUser className="text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-400">Customer</p>
                  <p className="font-bold text-slate-800">
                    {selectedOrder.customer_name || 'Guest (Unregistered)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <FiClock className="text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-400">Order Time</p>
                  <p className="font-bold text-slate-800">
                    {selectedOrder.formatted_time || 'Recent'} ({selectedOrder.formatted_date || 'Today'})
                  </p>
                </div>
              </div>
            </div>

            {/* Special Order Note */}
            {selectedOrder.note && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                <p className="font-bold mb-0.5 flex items-center gap-1.5">
                  <FiFileText className="text-amber-600" />
                  <span>Customer Note for Kitchen:</span>
                </p>
                <p className="italic">{selectedOrder.note}</p>
              </div>
            )}

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ordered Items
              </h4>
              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl p-3">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-start text-xs">
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

            {/* Total Amount */}
            <div className="flex justify-between items-center p-4 bg-orange-50/60 rounded-2xl border border-orange-200">
              <span className="text-sm font-extrabold text-slate-900">Total Order Amount</span>
              <span className="text-xl font-black text-orange-600">
                {selectedOrder.formatted_total}
              </span>
            </div>

            {/* Status Change Buttons Pipeline */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Update Order Progression:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'confirmed', label: 'Confirm', color: 'bg-blue-600' },
                  { key: 'preparing', label: 'Preparing', color: 'bg-purple-600' },
                  { key: 'ready', label: 'Ready', color: 'bg-teal-600' },
                  { key: 'served', label: 'Served', color: 'bg-indigo-600' },
                  { key: 'completed', label: 'Completed', color: 'bg-emerald-600' },
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

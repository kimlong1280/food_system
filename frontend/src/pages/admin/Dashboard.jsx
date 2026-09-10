import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FiShoppingBag,
  FiClock,
  FiCheckCircle,
  FiDollarSign,
  FiArrowRight,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import StatsCard from '../../components/admin/StatsCard'
import StatusBadge from '../../components/admin/StatusBadge'
import { PageLoading } from '../../components/Loading'

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardStats = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await api.get('/admin/dashboard')
      setData(res.data)
      if (isManual) toast.success('Dashboard metrics updated!')
    } catch {
      toast.error('Failed to load dashboard metrics.')
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()

    // Polling every 30 seconds for live order updates
    const timer = setInterval(() => {
      fetchDashboardStats()
    }, 30000)

    return () => clearInterval(timer)
  }, [])

  // Quick order status update from dashboard
  const handleQuickStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus })
      toast.success(`Order status updated to ${newStatus}!`)
      fetchDashboardStats()
    } catch {
      toast.error('Failed to update order status.')
    }
  }

  if (loading) return <PageLoading text="Aggregating restaurant statistics..." />

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time dine-in order metrics and restaurant performance.
          </p>
        </div>

        <button
          onClick={() => fetchDashboardStats(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs active:scale-95 transition-all self-start sm:self-auto"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatsCard
          title="Today's Orders"
          value={data?.today_orders || 0}
          subtext="Placed today"
          icon={<FiShoppingBag />}
          color="blue"
        />

        <StatsCard
          title="Pending Kitchen"
          value={data?.pending_orders || 0}
          subtext="Awaiting preparation"
          icon={<FiClock />}
          color="orange"
        />

        <StatsCard
          title="Completed Today"
          value={data?.completed_orders || 0}
          subtext="Served & closed"
          icon={<FiCheckCircle />}
          color="emerald"
        />

        <StatsCard
          title="Today's Revenue"
          value={data?.formatted_today_revenue || '$0.00'}
          subtext={`All-time: ${data?.formatted_total_revenue || '$0.00'}`}
          icon={<FiDollarSign />}
          color="purple"
        />
      </div>

      {/* Notice if any menu items are unavailable */}
      {data?.unavailable_items_count > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              You currently have <strong>{data.unavailable_items_count} menu items</strong> marked as sold out / unavailable.
            </span>
          </div>
          <Link
            to="/admin/menu-items"
            className="font-bold underline text-amber-900 hover:text-amber-700"
          >
            Manage Menu
          </Link>
        </div>
      )}

      {/* Two Column Layout: Recent Orders & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recent Dine-In Orders</h2>
              <p className="text-xs text-slate-500">Live incoming customer orders</p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
            >
              <span>View All</span>
              <FiArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-bold">Order #</th>
                  <th className="pb-3 font-bold">Table</th>
                  <th className="pb-3 font-bold">Total</th>
                  <th className="pb-3 font-bold">Time</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recent_orders?.length > 0 ? (
                  data.recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 font-black text-slate-900">
                        <Link
                          to={`/admin/orders?search=${order.order_number}`}
                          className="hover:text-orange-600"
                        >
                          #{order.order_number}
                        </Link>
                      </td>
                      <td className="py-3 font-bold text-slate-800">
                        Table {order.table_number}
                      </td>
                      <td className="py-3 font-extrabold text-orange-600">
                        {order.formatted_total}
                      </td>
                      <td className="py-3 text-slate-500">{order.formatted_time}</td>
                      <td className="py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-right">
                        {order.status === 'pending' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'confirmed')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs"
                          >
                            Confirm
                          </button>
                        ) : order.status === 'confirmed' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'preparing')}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-2xs"
                          >
                            Prepare
                          </button>
                        ) : order.status === 'preparing' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'ready')}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold shadow-2xs"
                          >
                            Mark Ready
                          </button>
                        ) : order.status === 'ready' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'served')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs"
                          >
                            Mark Served
                          </button>
                        ) : order.status === 'served' ? (
                          <button
                            onClick={() => handleQuickStatusUpdate(order.id, 'completed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs"
                          >
                            Complete
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No orders placed today yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Top Selling Items */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Popular Dishes</h2>
            <p className="text-xs text-slate-500">Most ordered items by customers</p>
          </div>

          <div className="space-y-3">
            {data?.popular_items?.length > 0 ? (
              data.popular_items.map((entry, idx) => (
                <div
                  key={entry.item.id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <span className="w-6 text-center font-black text-xs text-slate-400">
                    #{idx + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                    <img
                      src={entry.item.image}
                      alt={entry.item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {entry.item.name}
                    </p>
                    <p className="text-[11px] text-orange-600 font-semibold">
                      {entry.item.formatted_price}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-slate-700">
                      {entry.total_ordered} sold
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No orders recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

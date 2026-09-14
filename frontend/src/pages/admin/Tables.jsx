import { useState, useEffect } from 'react'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiX,
  FiSmartphone,
  FiUsers,
  FiUserCheck,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import QRCodeCard from '../../components/admin/QRCodeCard'
import { PageLoading } from '../../components/Loading'
import { useLanguage } from '../../context/LanguageContext'

const Tables = () => {
  const { t } = useLanguage()
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [occupancyFilter, setOccupancyFilter] = useState('all') // 'all', 'occupied', 'available'
  const [togglingOccupancyId, setTogglingOccupancyId] = useState(null)
  const [togglingStatusId, setTogglingStatusId] = useState(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [formData, setFormData] = useState({
    table_number: '',
    name: '',
    status: 'active',
    is_occupied: false,
  })
  const [submitting, setSubmitting] = useState(false)

  // QR Code View Modal
  const [viewingQRTable, setViewingQRTable] = useState(null)

  // Delete State
  const [deletingTable, setDeletingTable] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchTables = async () => {
    try {
      const res = await api.get('/admin/tables')
      setTables(res.data.data || [])
    } catch {
      toast.error(t('failedLoadTables'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  const handleOpenModal = (tbl = null) => {
    if (tbl) {
      setEditingTable(tbl)
      setFormData({
        table_number: tbl.table_number,
        name: tbl.name || '',
        status: tbl.status,
        is_occupied: Boolean(tbl.is_occupied),
      })
    } else {
      setEditingTable(null)
      const nextNum = String(tables.length + 1).padStart(2, '0')
      setFormData({
        table_number: nextNum,
        name: `Table ${nextNum}`,
        status: 'active',
        is_occupied: false,
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingTable) {
        await api.put(`/admin/tables/${editingTable.id}`, formData)
        toast.success(t('tableUpdatedSuccess'))
      } else {
        await api.post('/admin/tables', formData)
        toast.success(t('tableCreatedSuccess'))
      }

      setIsModalOpen(false)
      fetchTables()
    } catch (err) {
      const msg = err.response?.data?.message || t('failedSaveTable')
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Quick 1-click toggle active/inactive status
  const handleToggleStatus = async (tbl) => {
    setTogglingStatusId(tbl.id)
    try {
      const res = await api.patch(`/admin/tables/${tbl.id}/toggle-status`)
      setTables((prev) =>
        prev.map((t) => (t.id === tbl.id ? { ...t, status: res.data.table.status } : t))
      )
      toast.success(res.data.message)
    } catch {
      toast.error(t('failedUpdateStatus'))
    } finally {
      setTogglingStatusId(null)
    }
  }

  // Quick 1-click toggle occupancy status (Customer In vs Available)
  const handleToggleOccupancy = async (tbl) => {
    setTogglingOccupancyId(tbl.id)
    try {
      const res = await api.patch(`/admin/tables/${tbl.id}/toggle-occupancy`)
      const newOccupied = Boolean(res.data.table.is_occupied)
      setTables((prev) =>
        prev.map((t) => (t.id === tbl.id ? { ...t, is_occupied: newOccupied } : t))
      )
      toast.success(res.data.message)
    } catch {
      toast.error(t('failedUpdateStatus'))
    } finally {
      setTogglingOccupancyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingTable) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/tables/${deletingTable.id}`)
      toast.success(t('tableDeletedSuccess'))
      setDeletingTable(null)
      fetchTables()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        t('cannotDeleteTableMsg')
      toast.error(msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  const activeTablesCount = tables.filter((t) => t.status === 'active').length
  const inactiveTablesCount = tables.filter((t) => t.status !== 'active').length
  const occupiedTablesCount = tables.filter((t) => t.is_occupied).length
  const availableTablesCount = tables.filter((t) => !t.is_occupied && t.status === 'active').length

  const filteredTables = tables.filter((t) => {
    const q = searchQuery.toLowerCase()
    const matchesQuery =
      t.table_number.toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q)

    const matchesOccupancy =
      occupancyFilter === 'all'
        ? true
        : occupancyFilter === 'occupied'
        ? Boolean(t.is_occupied)
        : !t.is_occupied

    return matchesQuery && matchesOccupancy
  })

  if (loading) return <PageLoading text={t('loadingTablesAndQr')} />

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('tablesTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
              {t('totalTablesCount', { count: tables.length })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              👥 {t('seatedCount', { count: occupiedTablesCount })}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              🪑 {t('freeCount', { count: availableTablesCount })}
            </span>
            <span className="text-slate-400">•</span>
            <span>{t('activeCount', { count: activeTablesCount })}</span>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all self-stretch sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4 stroke-[3]" />
          <span>{t('addNewTable')}</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setOccupancyFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              occupancyFilter === 'all'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {t('allTablesWithCount', { count: tables.length })}
          </button>
          <button
            type="button"
            onClick={() => setOccupancyFilter('occupied')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              occupancyFilter === 'occupied'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{t('customerInFilter')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                occupancyFilter === 'occupied'
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {occupiedTablesCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOccupancyFilter('available')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              occupancyFilter === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{t('availableFilter')}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                occupancyFilter === 'available'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {availableTablesCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <FiSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchTablePlaceholder')}
            className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 shadow-2xs"
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
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (Smartphone screens < 768px): Thumb-Friendly Table Cards */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredTables.length > 0 ? (
          filteredTables.map((tbl) => (
            <div
              key={tbl.id}
              className={`bg-white rounded-3xl p-4 border transition-all shadow-xs space-y-3 ${
                tbl.status !== 'active'
                  ? 'border-slate-200 bg-slate-50/60 opacity-85'
                  : tbl.is_occupied
                  ? 'border-amber-300 ring-1 ring-amber-300/40'
                  : 'border-slate-200/80'
              }`}
            >
              {/* Header: Table Pill, Area Name & Active Status */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-600 text-white font-black text-xs shadow-2xs">
                    <FiMapPin className="w-3.5 h-3.5" />
                    <span>{t('tableWithNumber', { number: tbl.table_number })}</span>
                  </span>
                  <span className="font-extrabold text-xs text-slate-800 truncate">
                    {tbl.name || t('standardDining')}
                  </span>
                </div>

                {/* 1-Tap Active/Inactive Status Switch */}
                <button
                  type="button"
                  disabled={togglingStatusId === tbl.id}
                  onClick={() => handleToggleStatus(tbl)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer active:scale-95 ${
                    tbl.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {tbl.status === 'active' ? `🟢 ${t('statusActive')}` : `⚪ ${t('statusInactive')}`}
                </button>
              </div>

              {/* 1-Tap Occupancy Management for Staff on Smartphone */}
              <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold text-slate-500">{t('diningSeatingHeader')}:</span>
                  {tbl.is_occupied ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-300 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>{t('customerInFilter')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px] border border-emerald-300 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{t('availableFilter')}</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={togglingOccupancyId === tbl.id}
                  onClick={() => handleToggleOccupancy(tbl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-xs flex items-center gap-1 ${
                    tbl.is_occupied
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {togglingOccupancyId === tbl.id ? (
                    <span>{t('saving')}</span>
                  ) : tbl.is_occupied ? (
                    <span>{t('markAvailable')}</span>
                  ) : (
                    <span>{t('markOccupied')}</span>
                  )}
                </button>
              </div>

              {/* Table Info & Orders Count */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                <span>{t('ordersRecorded')}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-extrabold text-slate-700 text-xs">
                  {tbl.orders_count || 0} {t('ordersHeader')}
                </span>
              </div>

              {/* Thumb Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setViewingQRTable(tbl)}
                  className="flex-1 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-orange-200 active:scale-95 transition-transform cursor-pointer"
                >
                  <FiSmartphone className="w-3.5 h-3.5" />
                  <span>{t('viewPrintQr')}</span>
                </button>

                <button
                  onClick={() => handleOpenModal(tbl)}
                  className="p-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
                  title={t('editTableModal')}
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  <span>{t('edit')}</span>
                </button>

                <button
                  onClick={() => setDeletingTable(tbl)}
                  className="p-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                  title={t('delete')}
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200/80">
            <FiMapPin className="w-6 h-6 mx-auto text-slate-300 mb-1" />
            <p className="font-bold text-slate-600 text-sm">{t('noTablesFound')}</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Screens >= 768px): Full Table */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">{t('tableNumberHeader')}</th>
                <th className="py-3.5 px-4 font-bold">{t('locationAreaHeader')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('diningSeatingHeader')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('activeStatusHeader')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('ordersHeader')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('qrStandeeHeader')}</th>
                <th className="py-3.5 px-4 font-bold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTables.length > 0 ? (
                filteredTables.map((tbl) => (
                  <tr
                    key={tbl.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      tbl.is_occupied ? 'bg-amber-50/25' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 font-extrabold border border-orange-200">
                        <FiMapPin className="w-3.5 h-3.5" />
                        <span>{t('tableWithNumber', { number: tbl.table_number })}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {tbl.name || (
                        <span className="text-slate-400 font-normal italic">{t('standardDining')}</span>
                      )}
                    </td>

                    {/* Dining Seating Status 1-Click Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={togglingOccupancyId === tbl.id}
                        onClick={() => handleToggleOccupancy(tbl)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase transition-all cursor-pointer active:scale-95 shadow-2xs ${
                          tbl.is_occupied
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        }`}
                        title={tbl.is_occupied ? t('markAvailable') : t('markOccupied')}
                      >
                        {tbl.is_occupied ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>{t('customerInFilter')}</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{t('availableFilter')}</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Active / Inactive Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={togglingStatusId === tbl.id}
                        onClick={() => handleToggleStatus(tbl)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                          tbl.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title={tbl.status === 'active' ? t('statusActive') : t('statusInactive')}
                      >
                        {tbl.status === 'active' ? (
                          <>
                            <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>{t('statusActive')}</span>
                          </>
                        ) : (
                          <>
                            <FiXCircle className="w-3 h-3 text-slate-400" />
                            <span>{t('statusInactive')}</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Total Orders */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {tbl.orders_count || 0}
                      </span>
                    </td>

                    {/* QR Standee */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setViewingQRTable(tbl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition-colors cursor-pointer"
                      >
                        <FiSmartphone className="w-3.5 h-3.5" />
                        <span>{t('viewQr')}</span>
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(tbl)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
                        title={t('editTableModal')}
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTable(tbl)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                        title={t('delete')}
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {t('noTablesFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? t('editTableModal') : t('addTableModal')}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('tableNumberLabel')} *
            </label>
            <input
              type="text"
              required
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              placeholder={t('tableNumberInputPlaceholder')}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs font-extrabold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('tableNameLabel')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('tableNameInputPlaceholder')}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('customerDiningStatus')}
              </label>
              <select
                value={formData.is_occupied ? 'true' : 'false'}
                onChange={(e) =>
                  setFormData({ ...formData, is_occupied: e.target.value === 'true' })
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 bg-white shadow-2xs cursor-pointer font-bold"
              >
                <option value="false">{t('availableNoCustomer')}</option>
                <option value="true">{t('customerInOccupied')}</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('activeStatusHeader')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 bg-white shadow-2xs cursor-pointer font-bold"
              >
                <option value="active">🟢 {t('statusActive')}</option>
                <option value="inactive">⚪ {t('statusInactive')}</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? t('saving') : editingTable ? t('saveChanges') : t('create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Standee Viewer Modal */}
      {viewingQRTable && (
        <Modal
          isOpen={!!viewingQRTable}
          onClose={() => setViewingQRTable(null)}
          title={t('tableQrStandeeTitle', { number: viewingQRTable.table_number })}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <QRCodeCard table={viewingQRTable} />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTable}
        onClose={() => setDeletingTable(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`${t('delete')} "${t('tableWithNumber', { number: deletingTable?.table_number })}"?`}
        message={t('cannotDeleteTableMsg')}
      />
    </div>
  )
}

export default Tables

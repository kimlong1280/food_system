import { useState, useEffect } from 'react'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiMapPin,
  FiX,
  FiSmartphone,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import QRCodeCard from '../../components/admin/QRCodeCard'
import { PageLoading } from '../../components/Loading'

const Tables = () => {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [formData, setFormData] = useState({
    table_number: '',
    name: '',
    status: 'active',
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
      toast.error('Failed to load tables.')
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
      })
    } else {
      setEditingTable(null)
      const nextNum = String(tables.length + 1).padStart(2, '0')
      setFormData({
        table_number: nextNum,
        name: `Table ${nextNum}`,
        status: 'active',
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
        toast.success('Table updated successfully!')
      } else {
        await api.post('/admin/tables', formData)
        toast.success('Table created successfully!')
      }

      setIsModalOpen(false)
      fetchTables()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save table.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Quick 1-click toggle active/inactive status
  const handleToggleStatus = async (tbl) => {
    try {
      const res = await api.patch(`/admin/tables/${tbl.id}/toggle-status`)
      setTables((prev) =>
        prev.map((t) => (t.id === tbl.id ? { ...t, status: res.data.table.status } : t))
      )
      toast.success(res.data.message)
    } catch {
      toast.error('Failed to toggle status.')
    }
  }

  const handleDelete = async () => {
    if (!deletingTable) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/tables/${deletingTable.id}`)
      toast.success('Table deleted.')
      setDeletingTable(null)
      fetchTables()
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Cannot delete table with active or past orders. Please deactivate it instead.'
      toast.error(msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredTables = tables.filter((t) => {
    const q = searchQuery.toLowerCase()
    return t.table_number.toLowerCase().includes(q) || (t.name || '').toLowerCase().includes(q)
  })

  const activeTablesCount = tables.filter((t) => t.status === 'active').length
  const inactiveTablesCount = tables.filter((t) => t.status !== 'active').length

  if (loading) return <PageLoading text="Loading tables & QR codes..." />

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tables & QR Codes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
              {tables.length} tables
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>Active: <strong className="text-emerald-600">{activeTablesCount}</strong></span>
            <span>•</span>
            <span>Inactive: <strong className="text-slate-400">{inactiveTablesCount}</strong></span>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all self-stretch sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4 stroke-[3]" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <FiSearch className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tables by number or area name..."
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

      {/* ========================================================================= */}
      {/* MOBILE VIEW (Smartphone screens < 768px): Thumb-Friendly Table Cards */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredTables.length > 0 ? (
          filteredTables.map((tbl) => (
            <div
              key={tbl.id}
              className={`bg-white rounded-3xl p-4 border transition-all shadow-xs space-y-3 ${
                tbl.status !== 'active' ? 'border-slate-200 bg-slate-50/60 opacity-85' : 'border-slate-200/80'
              }`}
            >
              {/* Header: Table Pill, Area Name & Status */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-600 text-white font-black text-xs shadow-2xs">
                    <FiMapPin className="w-3.5 h-3.5" />
                    <span>Table {tbl.table_number}</span>
                  </span>
                  <span className="font-extrabold text-xs text-slate-800 truncate">
                    {tbl.name || 'Standard Dining'}
                  </span>
                </div>

                {/* 1-Tap Status Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(tbl)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer active:scale-95 ${
                    tbl.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {tbl.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                </button>
              </div>

              {/* Table Info & Orders */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                <span>Orders recorded:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-extrabold text-slate-700 text-xs">
                  {tbl.orders_count || 0} orders
                </span>
              </div>

              {/* Thumb Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setViewingQRTable(tbl)}
                  className="flex-1 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-orange-200 active:scale-95 transition-transform cursor-pointer"
                >
                  <FiSmartphone className="w-3.5 h-3.5" />
                  <span>View / Print QR</span>
                </button>

                <button
                  onClick={() => handleOpenModal(tbl)}
                  className="p-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
                  title="Edit Table"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setDeletingTable(tbl)}
                  className="p-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                  title="Delete Table"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200/80">
            <FiMapPin className="w-6 h-6 mx-auto text-slate-300 mb-1" />
            <p className="font-bold text-slate-600 text-sm">No tables found</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Screens >= 768px): Full Table */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">Table #</th>
                <th className="py-3.5 px-4 font-bold">Location / Area Name</th>
                <th className="py-3.5 px-4 font-bold">Total Orders</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">QR Code</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTables.length > 0 ? (
                filteredTables.map((tbl) => (
                  <tr key={tbl.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 font-extrabold border border-orange-200">
                        <FiMapPin className="w-3.5 h-3.5" />
                        <span>Table {tbl.table_number}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {tbl.name || <span className="text-slate-400 font-normal italic">Standard Dining</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {tbl.orders_count || 0} orders
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(tbl)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                          tbl.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {tbl.status === 'active' ? (
                          <>
                            <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <FiXCircle className="w-3 h-3 text-slate-400" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setViewingQRTable(tbl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition-colors cursor-pointer"
                      >
                        <FiSmartphone className="w-3.5 h-3.5" />
                        <span>View QR</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(tbl)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
                        title="Edit Table"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTable(tbl)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Table"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No tables found.
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
        title={editingTable ? 'Edit Table' : 'Add New Table'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Table Number *
            </label>
            <input
              type="text"
              required
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              placeholder="e.g., 01, 02, T-A1..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs font-extrabold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Area / Friendly Name (Optional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Outdoor Patio, VIP Room 1, Bar Counter..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 bg-white shadow-2xs cursor-pointer"
            >
              <option value="active">Active (Available for customer orders)</option>
              <option value="inactive">Inactive (Disabled / Under Maintenance)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Standee Viewer Modal */}
      {viewingQRTable && (
        <Modal
          isOpen={!!viewingQRTable}
          onClose={() => setViewingQRTable(null)}
          title={`Table ${viewingQRTable.table_number} QR Standee`}
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
        title={`Delete "Table ${deletingTable?.table_number}"?`}
        message="Cannot delete tables with order history. If this table has active or past orders, please mark it as Inactive instead."
      />
    </div>
  )
}

export default Tables

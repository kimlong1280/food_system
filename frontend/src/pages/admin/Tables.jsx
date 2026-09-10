import { useState, useEffect } from 'react'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiEye,
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

  if (loading) return <PageLoading text="Loading tables & QR codes..." />

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tables & QR Codes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical dining tables, generate printable QR standees, and control table availability.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add New Table</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <FiSearch className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tables by number or area name..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 shadow-2xs"
        />
      </div>

      {/* Tables List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                      Table {tbl.table_number}
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all ${
                          tbl.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
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
                            <FiXCircle className="w-3 h-3 text-rose-600" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setViewingQRTable(tbl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 transition-colors"
                      >
                        <i className="fi fi-sr-smartphone text-xs" />
                        <span>View QR</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(tbl)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors"
                        title="Edit Table"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTable(tbl)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
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

      {/* Table Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? 'Edit Table' : 'Add New Table'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Table Number / Identifier *
            </label>
            <input
              type="text"
              required
              value={formData.table_number}
              onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
              placeholder="e.g. 01, 02, VIP-1..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Location / Name (Optional)
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Window Side, Booth Area, Terrace..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Table Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 bg-white"
            >
              <option value="active">Active (Available for Guests)</option>
              <option value="inactive">Inactive (Closed / Reserved)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Standee Card Modal */}
      {viewingQRTable && (
        <Modal
          isOpen={!!viewingQRTable}
          onClose={() => setViewingQRTable(null)}
          title={`Table ${viewingQRTable.table_number} QR Code`}
          maxWidth="max-w-md"
        >
          <QRCodeCard table={viewingQRTable} />
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTable}
        onClose={() => setDeletingTable(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`Delete Table ${deletingTable?.table_number}?`}
        message="Tables with historical order records cannot be deleted to preserve sales history. You can deactivate it instead."
      />
    </div>
  )
}

export default Tables

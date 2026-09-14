import { useState, useEffect } from 'react'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUser,
  FiShield,
  FiSearch,
  FiX,
  FiMail,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { PageLoading } from '../../components/Loading'
import { useLanguage } from '../../context/LanguageContext'

const Users = () => {
  const { user: currentUser } = useAuth()
  const { t } = useLanguage()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  })
  const [submitting, setSubmitting] = useState(false)

  // Delete State
  const [deletingUser, setDeletingUser] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.data || [])
    } catch {
      toast.error(t('failedLoadUsers'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenModal = (u = null) => {
    if (u) {
      setEditingUser(u)
      setFormData({
        name: u.name,
        email: u.email,
        password: '',
        role: u.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin',
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData)
        toast.success(t('userUpdatedSuccess'))
      } else {
        await api.post('/admin/users', formData)
        toast.success(t('userCreatedSuccess'))
      }

      setIsModalOpen(false)
      fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.message || t('failedSaveUser')
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/users/${deletingUser.id}`)
      toast.success(t('userDeletedSuccess'))
      setDeletingUser(null)
      fetchUsers()
    } catch (err) {
      const msg = err.response?.data?.message || t('failedSaveUser')
      toast.error(msg)
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })

  if (loading) return <PageLoading text={t('loadingUsers')} />

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('usersTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
              {t('totalUsersCount', { count: users.length })}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('usersSubtitle')}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all self-stretch sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4 stroke-[3]" />
          <span>{t('addNewAccount')}</span>
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
          placeholder={t('searchAccountsPlaceholder')}
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
      {/* MOBILE VIEW (Smartphone screens < 768px): Thumb-Friendly Staff Cards */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((u) => {
            const isCurrent = currentUser?.id === u.id

            return (
              <div
                key={u.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3"
              >
                {/* Header: Avatar, Name, Email, Role */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <h3 className="font-extrabold text-sm text-slate-900 truncate">{u.name}</h3>
                        {isCurrent && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded-full font-black shrink-0">
                            {t('youBadge')}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                        <FiShield className="w-2.5 h-2.5" />
                        <span>{u.role === 'admin' ? 'Admin' : u.role === 'cashier' ? 'Cashier' : 'Staff'}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 truncate">
                      <FiMail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(u)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                    <span>{t('editDetails')}</span>
                  </button>

                  <button
                    onClick={() => setDeletingUser(u)}
                    disabled={isCurrent}
                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:opacity-25 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                    title={isCurrent ? t('cannotDeleteOwnAccount') : t('deleteAccount')}
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200/80">
            <FiUser className="w-6 h-6 mx-auto text-slate-300 mb-1" />
            <p className="font-bold text-slate-600 text-sm">{t('noAccountsFound')}</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Screens >= 768px): Full Table */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">{t('userHeader')}</th>
                <th className="py-3.5 px-4 font-bold">{t('emailHeader')}</th>
                <th className="py-3.5 px-4 font-bold">{t('roleHeader')}</th>
                <th className="py-3.5 px-4 font-bold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                                {t('youBadge')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                          <FiShield className="w-3 h-3" />
                          <span>{u.role === 'admin' ? 'Admin' : u.role === 'cashier' ? 'Cashier' : 'Staff'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
                          title={t('editUserModal')}
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          disabled={isCurrent}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 disabled:opacity-30 transition-colors cursor-pointer"
                          title={isCurrent ? t('cannotDeleteOwnAccount') : t('deleteAccount')}
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    {t('noAccountsFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? t('editUserModal') : t('addUserModal')}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('userNameLabel')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('userNameInputPlaceholder')}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('userEmailLabel')} *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('userEmailInputPlaceholder')}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('userPasswordLabel')} {editingUser && t('leaveBlankKeepPassword')}
            </label>
            <input
              type="password"
              required={!editingUser}
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('userRoleLabel')}
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 bg-white shadow-2xs cursor-pointer"
            >
              <option value="admin">{t('roleAdmin')}</option>
              <option value="customer">{t('roleCustomer')}</option>
            </select>
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
              {submitting ? t('saving') : editingUser ? t('saveChanges') : t('create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={t('deleteUserConfirm', { name: deletingUser?.name || '' })}
        message={t('deleteUserMsg')}
      />
    </div>
  )
}

export default Users

import { useState, useEffect } from 'react'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
  FiX,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { PageLoading } from '../../components/Loading'
import { useLanguage } from '../../context/LanguageContext'

const Categories = () => {
  const { t } = useLanguage()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    sort_order: 0,
    status: true,
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchCategories = async () => {
    try {
      const res = await api.get('/admin/categories')
      setCategories(res.data.data || [])
    } catch {
      toast.error(t('failedLoadCategories'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat)
      setFormData({
        name: cat.name,
        description: cat.description || '',
        image: cat.image || '',
        sort_order: cat.sort_order || 0,
        status: cat.status,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
        image: '',
        sort_order: categories.length + 1,
        status: true,
      })
    }
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = new FormData()
      data.append('name', formData.name)
      data.append('description', formData.description)
      data.append('sort_order', formData.sort_order)
      data.append('status', formData.status ? 1 : 0)

      if (imageFile) {
        data.append('image_file', imageFile)
      } else if (formData.image) {
        data.append('image', formData.image)
      }

      if (editingCategory) {
        data.append('_method', 'PUT')
        await api.post(`/admin/categories/${editingCategory.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success(t('categoryUpdatedSuccess'))
      } else {
        await api.post('/admin/categories', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success(t('categoryCreatedSuccess'))
      }

      setIsModalOpen(false)
      fetchCategories()
    } catch (err) {
      const msg = err.response?.data?.message || t('failedSaveCategory')
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (cat) => {
    try {
      const nextStatus = !cat.status
      await api.put(`/admin/categories/${cat.id}`, { status: nextStatus })
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, status: nextStatus } : c))
      )
      toast.success(`"${cat.name}" -> ${nextStatus ? t('statusActive') : t('statusInactive')}`)
    } catch {
      toast.error(t('failedSaveCategory'))
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/categories/${deletingCategory.id}`)
      toast.success(t('categoryDeletedSuccess'))
      setDeletingCategory(null)
      fetchCategories()
    } catch {
      toast.error(t('failedSaveCategory'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <PageLoading text="Loading categories..." />

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t('categoriesTitle')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
              {categories.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('categoriesSubtitle')}
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all self-stretch sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4 stroke-[3]" />
          <span>{t('addCategoryModal')}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <FiSearch className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search')}
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
      {/* MOBILE VIEW (Smartphone screens < 768px): Thumb-Friendly Category Cards */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3"
            >
              {/* Category Info Row */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={
                      cat.image ||
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80'
                    }
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80'
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                      #{cat.sort_order}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {cat.description || '—'}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {cat.menu_items_count || 0} {t('items')}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(cat)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-all cursor-pointer ${
                        cat.status
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {cat.status ? `🟢 ${t('statusActive')}` : `⚪ ${t('statusInactive')}`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => handleOpenModal(cat)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  <span>{t('editCategoryModal')}</span>
                </button>
                <button
                  onClick={() => setDeletingCategory(cat)}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
                  title={t('delete')}
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200/80">
            <FiLayers className="w-6 h-6 mx-auto text-slate-300 mb-1" />
            <p className="font-bold text-slate-600 text-sm">{t('noOrdersFound')}</p>
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
                <th className="py-3.5 px-4 font-bold">{t('categoryOrderLabel')}</th>
                <th className="py-3.5 px-4 font-bold">{t('categoryImageLabel')}</th>
                <th className="py-3.5 px-4 font-bold">{t('categoryNameLabel')}</th>
                <th className="py-3.5 px-4 font-bold">{t('categoryDescriptionLabel')}</th>
                <th className="py-3.5 px-4 font-bold">{t('itemsCol')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('statusCol')}</th>
                <th className="py-3.5 px-4 font-bold text-right">{t('actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-400">#{cat.sort_order}</td>
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={
                            cat.image ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{cat.name}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {cat.description || <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
                        {cat.menu_items_count || 0} {t('items')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                          cat.status
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title={t('changeStatusTo')}
                      >
                        {cat.status ? (
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
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(cat)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
                        title={t('editCategoryModal')}
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCategory(cat)}
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
                    {t('noOrdersFoundDesc')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? t('editCategoryModal') : t('addCategoryModal')}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('categoryNameLabel')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('categoryNameInputPlaceholder')}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('categoryDescriptionLabel')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('categoryDescriptionInputPlaceholder')}
              rows={2}
              className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('categoryOrderLabel')}
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('categoryStatusLabel')}
              </label>
              <select
                value={formData.status ? '1' : '0'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value === '1' })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 bg-white shadow-2xs cursor-pointer"
              >
                <option value="1">{t('statusActive')}</option>
                <option value="0">{t('statusInactive')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('categoryImageLabel')}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('categoryImageLabel')} (URL)
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
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
              {submitting ? t('saving') : editingCategory ? t('save') : t('addCategoryModal')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`${t('delete')} "${deletingCategory?.name}"?`}
        message={t('confirmDeleteCategory')}
      />
    </div>
  )
}

export default Categories

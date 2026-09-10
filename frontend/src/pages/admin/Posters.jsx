import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiImage } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { PageLoading } from '../../components/Loading'

const Posters = () => {
  const [posters, setPosters] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPoster, setEditingPoster] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    status: true,
    start_date: '',
    end_date: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete State
  const [deletingPoster, setDeletingPoster] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchPosters = async () => {
    try {
      const res = await api.get('/admin/posters')
      setPosters(res.data.data || [])
    } catch {
      toast.error('Failed to load posters.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosters()
  }, [])

  const handleOpenModal = (poster = null) => {
    if (poster) {
      setEditingPoster(poster)
      setFormData({
        title: poster.title,
        description: poster.description || '',
        image: poster.image || '',
        status: poster.status,
        start_date: poster.start_date || '',
        end_date: poster.end_date || '',
      })
    } else {
      setEditingPoster(null)
      setFormData({
        title: '',
        description: '',
        image: '',
        status: true,
        start_date: '',
        end_date: '',
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
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('status', formData.status ? 1 : 0)
      if (formData.start_date) data.append('start_date', formData.start_date)
      if (formData.end_date) data.append('end_date', formData.end_date)

      if (imageFile) {
        data.append('image_file', imageFile)
      } else if (formData.image) {
        data.append('image', formData.image)
      }

      if (editingPoster) {
        data.append('_method', 'PUT')
        await api.post(`/admin/posters/${editingPoster.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Poster updated successfully!')
      } else {
        await api.post('/admin/posters', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Poster created successfully!')
      }

      setIsModalOpen(false)
      fetchPosters()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save poster.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPoster) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/posters/${deletingPoster.id}`)
      toast.success('Poster deleted.')
      setDeletingPoster(null)
      fetchPosters()
    } catch {
      toast.error('Failed to delete poster.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return <PageLoading text="Loading promotional banners..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Promotional Posters & Banners
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Display special deals, discounts, and combo offers on the customer homepage carousel.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posters.map((poster) => (
          <div
            key={poster.id}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-21/9 bg-slate-900 overflow-hidden">
                <img
                  src={poster.image}
                  alt={poster.title}
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      poster.status
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-rose-500 text-white shadow-xs'
                    }`}
                  >
                    {poster.status ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-1">
                <h3 className="font-extrabold text-base text-slate-900">{poster.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {poster.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                {poster.start_date || poster.end_date
                  ? `${poster.start_date || 'Always'} → ${poster.end_date || 'Ongoing'}`
                  : 'Always active'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenModal(poster)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors"
                  title="Edit Banner"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingPoster(poster)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                  title="Delete Banner"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPoster ? 'Edit Banner' : 'Create Banner'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Banner Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Special Combo Offer!"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Promotional copy displayed over the banner image..."
              rows={2}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Upload Image File (or provide URL below)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Image Web URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
              <span className="font-bold text-slate-800">Banner Active (Visible to Customers)</span>
            </label>
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
              {submitting ? 'Saving...' : editingPoster ? 'Save Changes' : 'Create Banner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingPoster}
        onClose={() => setDeletingPoster(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`Delete Banner "${deletingPoster?.title}"?`}
        message="This banner will immediately stop appearing on the customer menu homepage."
      />
    </div>
  )
}

export default Posters

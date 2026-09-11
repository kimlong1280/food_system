import { useState, useEffect } from 'react'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiStar,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { PageLoading } from '../../components/Loading'

const MenuItems = () => {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    type: 'food',
    image: '',
    is_available: true,
    is_featured: false,
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Delete State
  const [deletingItem, setDeletingItem] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [itemsRes, catRes] = await Promise.all([
        api.get('/admin/menu-items'),
        api.get('/admin/categories'),
      ])
      setItems(itemsRes.data.data || [])
      setCategories(catRes.data.data || [])
    } catch {
      toast.error('Failed to load menu items.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const KHR_RATE = 4000
  const [priceCurrency, setPriceCurrency] = useState('USD') // 'USD' | 'KHR'
  const [khrPrice, setKhrPrice] = useState('')

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        category_id: item.category_id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        type: item.type,
        image: item.image || '',
        is_available: item.is_available,
        is_featured: item.is_featured,
      })
      setPriceCurrency('USD')
      setKhrPrice(Math.round(Number(item.price) * KHR_RATE).toString())
    } else {
      setEditingItem(null)
      setFormData({
        category_id: categories[0]?.id || '',
        name: '',
        description: '',
        price: '',
        type: 'food',
        image: '',
        is_available: true,
        is_featured: false,
      })
      setPriceCurrency('USD')
      setKhrPrice('')
    }
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleUsdChange = (val) => {
    setFormData((prev) => ({ ...prev, price: val }))
    if (val && !isNaN(val)) {
      setKhrPrice(Math.round(Number(val) * KHR_RATE).toString())
    } else {
      setKhrPrice('')
    }
  }

  const handleKhrChange = (val) => {
    setKhrPrice(val)
    if (val && !isNaN(val)) {
      setFormData((prev) => ({ ...prev, price: (Number(val) / KHR_RATE).toFixed(2) }))
    } else {
      setFormData((prev) => ({ ...prev, price: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = new FormData()
      data.append('category_id', formData.category_id)
      data.append('name', formData.name)
      data.append('description', formData.description)
      data.append('price', formData.price)
      data.append('type', formData.type)
      data.append('is_available', formData.is_available ? 1 : 0)
      data.append('is_featured', formData.is_featured ? 1 : 0)

      if (imageFile) {
        data.append('image_file', imageFile)
      } else if (formData.image) {
        data.append('image', formData.image)
      }

      if (editingItem) {
        data.append('_method', 'PUT')
        await api.post(`/admin/menu-items/${editingItem.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Dish updated successfully!')
      } else {
        await api.post('/admin/menu-items', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Dish created successfully!')
      }

      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save menu item.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Quick 1-click toggle availability
  const handleToggleAvailability = async (item) => {
    try {
      const res = await api.patch(`/admin/menu-items/${item.id}/toggle-availability`)
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: res.data.is_available } : i))
      )
      toast.success(
        `"${item.name}" is now ${res.data.is_available ? 'Available' : 'Unavailable (Sold Out)'}!`
      )
    } catch {
      toast.error('Failed to toggle availability.')
    }
  }

  // Quick 1-click toggle featured
  const handleToggleFeatured = async (item) => {
    try {
      const res = await api.patch(`/admin/menu-items/${item.id}/toggle-featured`)
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_featured: res.data.is_featured } : i))
      )
      toast.success(
        `"${item.name}" ${res.data.is_featured ? 'marked as Popular' : 'removed from Popular'}!`
      )
    } catch {
      toast.error('Failed to toggle featured status.')
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/menu-items/${deletingItem.id}`)
      toast.success('Dish deleted.')
      setDeletingItem(null)
      fetchData()
    } catch {
      toast.error('Failed to delete dish.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (selectedCategory && item.category_id !== parseInt(selectedCategory)) return false
    if (selectedType && item.type !== selectedType) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q)
    }
    return true
  })

  if (loading) return <PageLoading text="Loading menu items..." />

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Menu Items</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage food, drinks, desserts, prices, and stock availability.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <FiSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes by name or description..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs"
          >
            <option value="">All Types</option>
            <option value="food">Food</option>
            <option value="drink">Drinks</option>
            <option value="dessert">Desserts</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">Image</th>
                <th className="py-3.5 px-4 font-bold">Dish Name</th>
                <th className="py-3.5 px-4 font-bold">Category</th>
                <th className="py-3.5 px-4 font-bold">Price</th>
                <th className="py-3.5 px-4 font-bold">Type</th>
                <th className="py-3.5 px-4 font-bold text-center">Featured</th>
                <th className="py-3.5 px-4 font-bold text-center">Available</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={
                            item.image ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-extrabold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-400 max-w-xs truncate mt-0.5">
                        {item.description || 'No description'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-orange-600 text-sm">
                        {item.formatted_price}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {item.formatted_price_khr || `${(parseFloat(item.price) * 4000).toLocaleString()} ៛`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                        {item.type}
                      </span>
                    </td>

                    {/* Quick 1-Click Featured Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(item)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.is_featured
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                        }`}
                        title="Toggle Popular/Featured"
                      >
                        <FiStar className={`w-4 h-4 ${item.is_featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Quick 1-Click Availability Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all ${
                          item.is_available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle availability"
                      >
                        {item.is_available ? (
                          <>
                            <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <FiXCircle className="w-3 h-3 text-rose-600" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors"
                        title="Edit Dish"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                        title="Delete Dish"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No dishes found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dish Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Dish' : 'Create New Dish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Dish Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Crispy Chicken Burger"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 bg-white"
              >
                <option value="food">Food</option>
                <option value="drink">Drink</option>
                <option value="dessert">Dessert</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                {priceCurrency === 'USD' ? 'Price ($ USD) *' : 'Price (៛ KHR / រៀល) *'}
              </label>

              {/* Currency Selector Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPriceCurrency('USD')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    priceCurrency === 'USD'
                      ? 'bg-white text-orange-600 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  💵 USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPriceCurrency('KHR')
                    if (!khrPrice && formData.price) {
                      setKhrPrice(Math.round(Number(formData.price) * KHR_RATE).toString())
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    priceCurrency === 'KHR'
                      ? 'bg-white text-orange-600 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  🇰🇭 KHR (៛)
                </button>
              </div>
            </div>

            {priceCurrency === 'USD' ? (
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => handleUsdChange(e.target.value)}
                  placeholder="2.50"
                  className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 text-sm font-bold"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="100"
                  min="100"
                  required
                  value={khrPrice}
                  onChange={(e) => handleKhrChange(e.target.value)}
                  placeholder="10000"
                  className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 text-sm font-bold"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">៛</span>
              </div>
            )}

            {/* Quick KHR Presets */}
            {priceCurrency === 'KHR' && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                <span className="text-[10px] text-slate-400 font-semibold mr-0.5">រហ័ស (Quick):</span>
                {[4000, 6000, 8000, 10000, 12000, 15000, 20000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleKhrChange(amt.toString())}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                      khrPrice === amt.toString()
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {amt.toLocaleString()}៛
                  </button>
                ))}
              </div>
            )}

            {/* Live Conversion Preview */}
            <div className="mt-2 flex items-center justify-between text-[11px] p-2 bg-orange-50/70 border border-orange-100 rounded-xl text-orange-900">
              <span className="font-medium">
                {priceCurrency === 'USD' ? (
                  <>
                    សមមូលជារៀល:{' '}
                    <strong className="font-extrabold text-orange-900">
                      {formData.price && !isNaN(formData.price)
                        ? `${Math.round(Number(formData.price) * KHR_RATE).toLocaleString()} ៛`
                        : '0 ៛'}
                    </strong>
                  </>
                ) : (
                  <>
                    សមមូលជាដុល្លារ:{' '}
                    <strong className="font-extrabold text-orange-900">
                      {khrPrice && !isNaN(khrPrice)
                        ? `$${(Number(khrPrice) / KHR_RATE).toFixed(2)} USD`
                        : '$0.00 USD'}
                    </strong>
                  </>
                )}
              </span>
              <span className="text-[10px] text-orange-600/80 font-bold">
                (អត្រា $1 = 4,000 ៛)
              </span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Appetizing description of ingredients, flavor, and cooking style..."
              rows={2}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Dish Image Upload (or provide URL below)
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

          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
              <span className="font-bold text-slate-800">Available (In Stock)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
              <span className="font-bold text-slate-800">Featured / Popular</span>
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
              {submitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Dish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={`Delete "${deletingItem?.name}"?`}
        message="Are you sure you want to delete this menu item? Note that past orders will still retain their item history."
      />
    </div>
  )
}

export default MenuItems

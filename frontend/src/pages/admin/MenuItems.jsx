import { useState, useEffect } from 'react'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiCoffee,
  FiTag,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Modal from '../../components/admin/Modal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { PageLoading } from '../../components/Loading'
import { useLanguage } from '../../context/LanguageContext'

const MenuItems = () => {
  const { t } = useLanguage()
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
      toast.error(t('failedLoadMenuItems'))
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

  // Multi-price state
  const [pricingMode, setPricingMode] = useState('single') // 'single' | 'multiple'
  const [priceVariants, setPriceVariants] = useState([
    { name: 'Small', price: '', khrPrice: '', is_default: true },
    { name: 'Medium', price: '', khrPrice: '', is_default: false },
    { name: 'Large', price: '', khrPrice: '', is_default: false },
  ])

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

      if (item.prices && item.prices.length > 0) {
        setPricingMode('multiple')
        setPriceVariants(
          item.prices.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price.toString(),
            khrPrice: Math.round(Number(p.price) * KHR_RATE).toString(),
            is_default: !!p.is_default,
          }))
        )
      } else {
        setPricingMode('single')
        setPriceVariants([
          { name: 'Normal', price: '3.00', khrPrice: '12000', is_default: true },
          { name: 'Special', price: '5.00', khrPrice: '20000', is_default: false },
          { name: 'Very Special', price: '7.00', khrPrice: '28000', is_default: false },
        ])
      }
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
      setPricingMode('single')
      setPriceVariants([
        { name: 'Normal', price: '3.00', khrPrice: '12000', is_default: true },
        { name: 'Special', price: '5.00', khrPrice: '20000', is_default: false },
        { name: 'Very Special', price: '7.00', khrPrice: '28000', is_default: false },
      ])
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

  // Add a new price variant row
  const handleAddPriceVariant = (presetName = '', presetKhr = '', presetUsd = '') => {
    let khr = presetKhr ? presetKhr.toString() : ''
    let usd = presetUsd ? presetUsd.toString() : ''
    if (khr && !usd) {
      usd = (Number(khr) / KHR_RATE).toFixed(2)
    } else if (usd && !khr) {
      khr = Math.round(Number(usd) * KHR_RATE).toString()
    }
    const name = presetName || (khr ? `${Number(khr).toLocaleString()} ៛` : '')

    setPriceVariants((prev) => [
      ...prev,
      {
        name: name,
        price: usd,
        khrPrice: khr,
        is_default: prev.length === 0,
      },
    ])
  }

  // Remove a price variant row
  const handleRemovePriceVariant = (index) => {
    setPriceVariants((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      if (updated.length > 0 && !updated.some((v) => v.is_default)) {
        updated[0].is_default = true
      }
      return updated
    })
  }

  // Update a field in a price variant row
  const handleVariantChange = (index, field, val) => {
    setPriceVariants((prev) => {
      const updated = [...prev]
      if (field === 'price') {
        updated[index] = {
          ...updated[index],
          price: val,
          khrPrice: val && !isNaN(val) ? Math.round(Number(val) * KHR_RATE).toString() : '',
        }
      } else if (field === 'khrPrice') {
        updated[index] = {
          ...updated[index],
          khrPrice: val,
          price: val && !isNaN(val) ? (Number(val) / KHR_RATE).toFixed(2) : '',
        }
      } else if (field === 'is_default') {
        return updated.map((v, i) => ({ ...v, is_default: i === index }))
      } else {
        updated[index] = { ...updated[index], [field]: val }
      }
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const data = new FormData()
      data.append('category_id', formData.category_id)
      data.append('name', formData.name)
      data.append('description', formData.description)
      data.append('type', formData.type)
      data.append('is_available', formData.is_available ? 1 : 0)
      data.append('is_featured', formData.is_featured ? 1 : 0)

      if (pricingMode === 'multiple') {
        const validVariants = priceVariants.filter((v) => Number(v.price) > 0 || Number(v.khrPrice) > 0)
        if (validVariants.length === 0) {
          toast.error(t('selectSizePrompt') || 'Please add at least one valid price.')
          setSubmitting(false)
          return
        }
        const formattedPrices = validVariants.map((v, idx) => {
          let usd = v.price && !isNaN(v.price) ? parseFloat(v.price) : 0
          if (usd <= 0 && v.khrPrice && !isNaN(v.khrPrice)) {
            usd = parseFloat((Number(v.khrPrice) / KHR_RATE).toFixed(2))
          }
          let name = v.name ? v.name.trim() : ''
          if (!name) {
            const khrAmt = v.khrPrice ? Number(v.khrPrice) : Math.round(usd * KHR_RATE)
            name = `${khrAmt.toLocaleString()} ៛`
          }
          return {
            id: v.id || undefined,
            name: name,
            price: usd,
            is_default: !!v.is_default,
            sort_order: idx,
          }
        })
        data.append('prices', JSON.stringify(formattedPrices))
      } else {
        data.append('price', formData.price)
        data.append('prices', JSON.stringify([]))
      }

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
        toast.success(t('menuItemUpdatedSuccess'))
      } else {
        await api.post('/admin/menu-items', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success(t('menuItemCreatedSuccess'))
      }

      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      const msg = err.response?.data?.message || t('failedSaveMenuItem')
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
        `"${item.name}" -> ${res.data.is_available ? t('inStock') : t('soldOut')}`
      )
    } catch {
      toast.error(t('failedSaveMenuItem'))
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
        `"${item.name}" -> ${res.data.is_featured ? t('featured') : t('standard')}`
      )
    } catch {
      toast.error(t('failedSaveMenuItem'))
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleteLoading(true)
    try {
      await api.delete(`/admin/menu-items/${deletingItem.id}`)
      toast.success(t('menuItemDeletedSuccess'))
      setDeletingItem(null)
      fetchData()
    } catch {
      toast.error(t('failedSaveMenuItem'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory ? String(item.category_id) === String(selectedCategory) : true
    const matchesType = selectedType ? item.type === selectedType : true

    return matchesSearch && matchesCategory && matchesType
  })

  const inStockCount = items.filter((i) => i.is_available).length
  const soldOutCount = items.filter((i) => !i.is_available).length

  if (loading) return <PageLoading text={t('loadingDishes')} />

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t('menuItemsTitle')}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-black">
              {filteredItems.length} {t('items')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>{t('inStock')}: <strong className="text-emerald-600">{inStockCount}</strong></span>
            <span>•</span>
            <span>{t('soldOut')}: <strong className="text-rose-600">{soldOutCount}</strong></span>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md shadow-orange-600/20 active:scale-95 transition-all self-stretch sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4 stroke-[3]" />
          <span>{t('addNewDish')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="sm:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FiSearch className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchMenuItemsPlaceholder')}
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

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              <option value="">{t('allCategoriesOption')} ({categories.length})</option>
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
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 focus:outline-hidden focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              <option value="">{t('allTypesOption')}</option>
              <option value="food">{t('itemFoodType')}</option>
              <option value="drink">{t('itemDrinkType')}</option>
              <option value="dessert">{t('itemDessertType')}</option>
              <option value="other">{t('otherType')}</option>
            </select>
          </div>
        </div>

        {/* Quick Category Pills on Mobile */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              !selectedCategory
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t('allCategoriesOption')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(String(c.id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                String(selectedCategory) === String(c.id)
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (Smartphone screens < 768px): Thumb-Friendly Dish Cards */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-4 border transition-all shadow-xs space-y-3 ${
                !item.is_available ? 'border-slate-200 bg-slate-50/50 opacity-90' : 'border-slate-200/80'
              }`}
            >
              {/* Top Dish Info */}
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative">
                  <img
                    src={
                      item.image ||
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&auto=format&fit=crop&q=80'
                    }
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=160&auto=format&fit=crop&q=80'
                    }}
                  />
                  {item.is_featured && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-xs text-[10px]">
                      ★
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">{item.name}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                      {item.type}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {item.description || item.category_name}
                  </p>

                    <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                      <span className="font-black text-orange-600 text-sm">
                        {item.has_multiple_prices && item.formatted_price_range
                          ? item.formatted_price_range
                          : item.formatted_price}
                      </span>
                      <span className="font-bold text-slate-400 text-xs">
                        {item.has_multiple_prices && item.formatted_price_range_khr
                          ? `(${item.formatted_price_range_khr})`
                          : `(${item.formatted_price_khr || `${(parseFloat(item.price) * 4000).toLocaleString()} ៛`})`}
                      </span>
                    </div>
                    {item.has_multiple_prices && item.prices && item.prices.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.prices.map((p) => (
                          <span key={p.id} className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/80 px-1.5 py-0.5 rounded-md">
                            {p.name}: ${parseFloat(p.price).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>

              {/* 1-Tap Quick Toggles Row (Stock & Featured) */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                {/* 1-Tap In Stock / Sold Out Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleAvailability(item)}
                  className={`py-2 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    item.is_available
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {item.is_available ? (
                    <>
                      <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('inStock')}</span>
                    </>
                  ) : (
                    <>
                      <FiXCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{t('soldOut')}</span>
                    </>
                  )}
                </button>

                {/* 1-Tap Featured Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleFeatured(item)}
                  className={`py-2 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    item.is_featured
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <FiStar className={`w-3.5 h-3.5 ${item.is_featured ? 'fill-amber-400 text-amber-500' : ''}`} />
                  <span>{item.is_featured ? t('featured') : t('standard')}</span>
                </button>
              </div>

              {/* Edit & Delete Action Row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  <span>{t('editDish')}</span>
                </button>
                <button
                  onClick={() => setDeletingItem(item)}
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
            <FiCoffee className="w-6 h-6 mx-auto text-slate-300 mb-1" />
            <p className="font-bold text-slate-600 text-sm">{t('noOrdersFound')}</p>
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
                <th className="py-3.5 px-4 font-bold">{t('itemImageLabel')}</th>
                <th className="py-3.5 px-4 font-bold">{t('itemNameLabel')}</th>
                <th className="py-3.5 px-4 font-bold">{t('itemCategoryLabel')}</th>
                <th className="py-3.5 px-4 font-bold">{t('itemPriceLabel')} (USD / KHR)</th>
                <th className="py-3.5 px-4 font-bold">{t('itemTypeLabel')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('featured')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('itemAvailableLabel')}</th>
                <th className="py-3.5 px-4 font-bold text-right">{t('actionsCol')}</th>
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
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-extrabold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-400 max-w-xs truncate mt-0.5">
                        {item.description || '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-orange-600 text-sm">
                        {item.has_multiple_prices && item.formatted_price_range
                          ? item.formatted_price_range
                          : item.formatted_price}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500">
                        {item.has_multiple_prices && item.formatted_price_range_khr
                          ? item.formatted_price_range_khr
                          : item.formatted_price_khr || `${(parseFloat(item.price) * 4000).toLocaleString()} ៛`}
                      </div>
                      {item.has_multiple_prices && item.prices && item.prices.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 max-w-xs">
                          {item.prices.map((p) => (
                            <span key={p.id} className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200/80 px-1.5 py-0.5 rounded-md">
                              {p.name}: ${parseFloat(p.price).toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}
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
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          item.is_featured
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                        }`}
                        title={t('featured')}
                      >
                        <FiStar className={`w-4 h-4 ${item.is_featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Quick 1-Click Availability Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                          item.is_available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title={t('itemAvailableLabel')}
                      >
                        {item.is_available ? (
                          <>
                            <FiCheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>{t('inStock')}</span>
                          </>
                        ) : (
                          <>
                            <FiXCircle className="w-3 h-3 text-rose-600" />
                            <span>{t('soldOut')}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer"
                        title={t('editDish')}
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {t('noOrdersFoundDesc')}
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
        title={editingItem ? t('editMenuItemModal') : t('addMenuItemModal')}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('itemNameLabel')} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('itemNameInputPlaceholder')}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('itemCategoryLabel')} *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 bg-white shadow-2xs cursor-pointer"
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
                {t('itemTypeLabel')} *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 bg-white shadow-2xs cursor-pointer"
              >
                <option value="food">{t('itemFoodType')}</option>
                <option value="drink">{t('itemDrinkType')}</option>
                <option value="dessert">{t('itemDessertType')}</option>
                <option value="other">{t('otherType')}</option>
              </select>
            </div>
          </div>

          {/* Pricing Model Selector: Single vs Multiple Prices */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                {t('pricingType')} *
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {pricingMode === 'multiple' ? `${priceVariants.length} ${t('priceOptions')}` : t('singlePrice')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPricingMode('single')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  pricingMode === 'single'
                    ? 'bg-white text-orange-600 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🏷️</span>
                <span>{t('singlePrice')}</span>
              </button>
              <button
                type="button"
                onClick={() => setPricingMode('multiple')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  pricingMode === 'multiple'
                    ? 'bg-white text-orange-600 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📐</span>
                <span>{t('multiPrice')}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {pricingMode === 'multiple'
                ? t('pricingSizesHelp')
                : 'Standard single price for this item across all orders.'}
            </p>
          </div>

          {/* SINGLE PRICE MODE INPUT */}
          {pricingMode === 'single' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  {priceCurrency === 'USD' ? `${t('itemPriceLabel')} *` : `${t('itemPriceLabel')} (KHR ៛) *`}
                </label>

                {/* Currency Selector Toggle */}
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPriceCurrency('USD')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required={pricingMode === 'single'}
                    value={formData.price}
                    onChange={(e) => handleUsdChange(e.target.value)}
                    placeholder="2.50"
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 text-sm font-bold shadow-2xs"
                  />
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    min="100"
                    required={pricingMode === 'single'}
                    value={khrPrice}
                    onChange={(e) => handleKhrChange(e.target.value)}
                    placeholder="10000"
                    className="w-full pl-3.5 pr-8 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 text-sm font-bold shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold">៛</span>
                </div>
              )}

              {/* Quick KHR Presets */}
              {priceCurrency === 'KHR' && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold mr-0.5">{t('quickKhr')}:</span>
                  {[4000, 6000, 8000, 10000, 12000, 15000, 20000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleKhrChange(amt.toString())}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
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
              <div className="mt-2 flex items-center justify-between text-[11px] p-2.5 bg-orange-50/70 border border-orange-100 rounded-2xl text-orange-900">
                <span className="font-medium">
                  {priceCurrency === 'USD' ? (
                    <>
                      {t('equivalentKhr')}{' '}
                      <strong className="font-extrabold text-orange-900">
                        {formData.price && !isNaN(formData.price)
                          ? `${Math.round(Number(formData.price) * KHR_RATE).toLocaleString()} ៛`
                          : '0 ៛'}
                      </strong>
                    </>
                  ) : (
                    <>
                      {t('equivalentUsd')}{' '}
                      <strong className="font-extrabold text-orange-900">
                        {khrPrice && !isNaN(khrPrice)
                          ? `$${(Number(khrPrice) / KHR_RATE).toFixed(2)} USD`
                          : '$0.00 USD'}
                      </strong>
                    </>
                  )}
                </span>
                <span className="text-[10px] text-orange-600/80 font-bold">{t('exchangeRateNote')}</span>
              </div>
            </div>
          ) : (
            /* MULTIPLE PRICES / SIZES / PORTIONS MANAGER */
            <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-3xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    {t('priceOptions')}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t('pricingSizesHelp')}
                  </p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-2 pt-1">
                <div>
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-1.5">
                    {t('presetSizes') || 'Popular Presets'}:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: 'Normal ($3)', name: 'Normal', usd: '3.00', khr: 12000 },
                      { label: 'Special ($5)', name: 'Special', usd: '5.00', khr: 20000 },
                      { label: 'Very Special ($7)', name: 'Very Special', usd: '7.00', khr: 28000 },
                      { label: 'Small ($2.50)', name: 'Small', usd: '2.50', khr: 10000 },
                      { label: 'Medium ($4.00)', name: 'Medium', usd: '4.00', khr: 16000 },
                      { label: 'Large ($6.00)', name: 'Large', usd: '6.00', khr: 24000 },
                      { label: '10,000 ៛', name: '10,000 ៛', usd: '2.50', khr: 10000 },
                      { label: '15,000 ៛', name: '15,000 ៛', usd: '3.75', khr: 15000 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleAddPriceVariant(preset.name, preset.khr, preset.usd)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50 text-[11px] font-bold text-slate-700 hover:text-orange-600 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Variant Rows */}
              <div className="space-y-2.5 pt-2">
                {priceVariants.map((variant, index) => (
                  <div
                    key={index}
                    className={`p-3.5 rounded-2xl border transition-all bg-white shadow-2xs space-y-2.5 ${
                      variant.is_default
                        ? 'border-orange-400 ring-2 ring-orange-500/15'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Default Radio */}
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="default_variant"
                          checked={variant.is_default}
                          onChange={() => handleVariantChange(index, 'is_default', true)}
                          className="text-orange-600 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className={`text-[11px] font-extrabold ${variant.is_default ? 'text-orange-600' : 'text-slate-500'}`}>
                          {variant.is_default ? `★ ${t('defaultOption')}` : t('defaultOption')}
                        </span>
                      </label>

                      {/* Remove Option Button */}
                      {priceVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePriceVariant(index)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title={t('removeOption')}
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      {/* Option Name Input (e.g. Normal, Special, Very Special) */}
                      <div className="sm:col-span-5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          {t('optionNameLabel')} (e.g. Normal, Special)
                        </label>
                        <input
                          type="text"
                          required
                          value={variant.name}
                          onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                          placeholder="e.g. Normal, Special, Very Special..."
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 font-bold bg-white"
                        />
                      </div>

                      {/* USD Price Input ($) */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Price ($ USD) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={variant.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            placeholder="3.00"
                            className="w-full pl-6 pr-2 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 font-black text-slate-900 bg-white"
                          />
                        </div>
                      </div>

                      {/* KHR Price (Auto-synced) */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          KHR (៛)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="100"
                            min="100"
                            value={variant.khrPrice}
                            onChange={(e) => handleVariantChange(index, 'khrPrice', e.target.value)}
                            placeholder="12000"
                            className="w-full pl-2.5 pr-6 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 font-bold text-slate-600 bg-white"
                          />
                          <span className="absolute right-2.5 top-2 text-slate-400 font-bold text-xs">៛</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Option Button */}
              <button
                type="button"
                onClick={() => handleAddPriceVariant('')}
                className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-orange-300 hover:border-orange-500 bg-orange-50/50 hover:bg-orange-50 text-orange-700 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
              >
                <FiPlus className="w-4 h-4" />
                <span>{t('addPriceOption')}</span>
              </button>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('itemDescriptionLabel')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('itemDescriptionInputPlaceholder')}
              rows={2}
              className="w-full p-3 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('itemImageLabel')}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('itemImageLabel')} (URL)
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-2xl focus:outline-hidden focus:border-orange-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer shadow-2xs">
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-slate-800">{t('inStock')}</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer shadow-2xs">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-slate-800">{t('featured')}</span>
            </label>
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
              {submitting ? t('saving') : editingItem ? t('save') : t('addMenuItemModal')}
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
        title={`${t('delete')} "${deletingItem?.name}"?`}
        message={t('confirmDeleteMenuItem')}
      />
    </div>
  )
}

export default MenuItems

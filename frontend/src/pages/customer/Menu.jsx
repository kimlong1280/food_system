import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import SearchBar from '../../components/SearchBar'
import CategoryList from '../../components/CategoryList'
import BannerCarousel from '../../components/BannerCarousel'
import MenuCard from '../../components/MenuCard'
import EmptyState from '../../components/EmptyState'
import { PageLoading, SkeletonCard } from '../../components/Loading'

const Menu = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { table, setTableInfo, addToCart } = useCart()
  const { t, translateCategory } = useLanguage()

  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)

  // Track verified table to prevent duplicate or looping toast notifications
  const verifiedTableIdRef = useRef(null)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Selected item for modal details
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalNote, setModalNote] = useState('')

  // 1. Table QR Detection & Verification
  useEffect(() => {
    const tableIdFromUrl = searchParams.get('table')
    if (!tableIdFromUrl) return

    // If customer is already connected to this table in state or already verified in this session, skip
    const isAlreadyConnected =
      (table && (String(table.id) === String(tableIdFromUrl) || String(table.table_number) === String(tableIdFromUrl))) ||
      verifiedTableIdRef.current === String(tableIdFromUrl)

    if (isAlreadyConnected) {
      verifiedTableIdRef.current = String(tableIdFromUrl)
      return
    }

    verifiedTableIdRef.current = String(tableIdFromUrl)

    const verifyTable = async () => {
      setTableLoading(true)
      try {
        const res = await api.get(`/tables/${tableIdFromUrl}`)
        const tableData = res.data.data

        setTableInfo(tableData)
        toast.success(t('connectedToTable', { number: tableData.table_number }), {
          icon: <i className="fi fi-sr-restaurant text-orange-500" />,
          duration: 4000,
        })
      } catch (err) {
        const message =
          err.response?.data?.message || t('tableDefaultErrorMessage')
        navigate('/table-error', { state: { message } })
      } finally {
        setTableLoading(false)
      }
    }

    verifyTable()
  }, [searchParams, table, navigate, setTableInfo, t])

  // 2. Fetch Menu Data (Categories, Items, Posters)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [catRes, itemsRes, postersRes] = await Promise.all([
          api.get('/categories'),
          api.get('/menu-items'),
          api.get('/posters').catch(() => ({ data: { data: [] } })),
        ])

        setCategories(catRes.data.data || [])
        setMenuItems(itemsRes.data.data || [])
        setBanners(postersRes.data.data || [])
      } catch {
        toast.error(t('failedLoadMenu'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [t])

  // 3. Client-side Search and Filter logic
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category / Popular filter
      if (selectedCategory === 'popular') {
        if (!item.is_featured) return false
      } else if (selectedCategory !== null && item.category_id !== selectedCategory) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesDesc = (item.description || '').toLowerCase().includes(q)
        if (!matchesName && !matchesDesc) return false
      }

      return true
    })
  }, [menuItems, selectedCategory, searchQuery])

  // Quick add from card
  const handleQuickAdd = (item, variant = null) => {
    addToCart(item, 1, '', variant)
    const displayName = variant ? `${item.name} (${variant.name})` : item.name
    toast.success(t('addedItemToCart', { name: displayName }), {
      icon: <i className="fi fi-sr-shopping-cart text-orange-500" />,
      duration: 2000,
    })
  }

  // Open modal details
  const handleSelectItem = (item, preferredVariant = null) => {
    setSelectedItem(item)
    setModalQuantity(1)
    setModalNote('')
    if (item.prices && item.prices.length > 0) {
      const defaultVar = preferredVariant || item.prices.find((p) => p.is_default) || item.prices[0]
      setSelectedVariant(defaultVar)
    } else {
      setSelectedVariant(null)
    }
  }

  // Add from modal with quantity & note
  const handleModalAdd = () => {
    if (!selectedItem) return
    addToCart(selectedItem, modalQuantity, modalNote, selectedVariant)
    const variantLabel = selectedVariant ? ` (${selectedVariant.name})` : ''
    toast.success(
      t('addedItemsToCart', { quantity: modalQuantity, name: `${selectedItem.name}${variantLabel}` }),
      {
        icon: <i className="fi fi-sr-shopping-cart text-orange-500" />,
      }
    )
    setSelectedItem(null)
  }

  if (tableLoading) {
    return <PageLoading text={t('verifyingTable')} />
  }

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory)
  const categoryHeaderTitle = selectedCategory === 'popular'
    ? (t('types.popular') || t('popularDishes'))
    : selectedCategoryObj
    ? translateCategory(selectedCategoryObj.name)
    : t('ourDeliciousMenu')

  return (
    <div className="pt-2 sm:pt-4 space-y-4 sm:space-y-5">
      {/* Welcome Banner / Table Greeting */}
      <div className="relative overflow-hidden flex items-center justify-between bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-400/5 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-orange-200/80 shadow-xs">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 pr-2">
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {table ? t('welcomeTable', { number: table.table_number }) : t('welcomeDefault')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 font-medium">
            {t('welcomeSub')}
          </p>
        </div>
        <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center text-lg sm:text-xl shadow-lg shadow-orange-500/30 shrink-0 animate-float">
          <i className="fi fi-sr-coffee" />
        </div>
      </div>

      {/* Promotional Banner Carousel */}
      {banners.length > 0 && <BannerCarousel banners={banners} />}

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Categories Navigation (Inline 3-4 Grid dropping down to next row on mobile) */}
      <div>
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
        />
      </div>

      {/* Food Grid Section */}
      <div>
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            {categoryHeaderTitle}
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {filteredItems.length} {filteredItems.length === 1 ? t('item') : t('items')}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onSelect={handleSelectItem}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="fi fi-sr-search"
            title={t('noMatchingDishes')}
            description={t('noMatchingDesc')}
            actionText={t('clearFilters')}
            onAction={() => {
              setSelectedCategory(null)
              setSearchQuery('')
            }}
          />
        )}
      </div>

      {/* Item Detail & Add-to-Cart Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-lg md:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative aspect-16/10 md:aspect-auto md:w-5/12 w-full bg-slate-100 shrink-0">
              <img
                src={
                  selectedItem.image ||
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
                }
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <i className="fi fi-sr-cross-small text-lg flex items-center justify-center" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {selectedItem.name}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">
                      {translateType(selectedItem.type)} • {translateCategory(selectedItem.category_name)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-orange-600 block">
                      ${(selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(selectedItem.price)).toFixed(2)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {(Math.round((selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(selectedItem.price)) * 4000)).toLocaleString()} ៛
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {selectedItem.description || t('defaultDishDesc')}
                </p>

                {/* Multiple Sizes / Price Options Selector */}
                {selectedItem.prices && selectedItem.prices.length > 1 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
                      <span>{t('chooseYourPrice')} *</span>
                      <span className="text-[10px] text-orange-600 font-bold lowercase">({selectedItem.prices.length} {t('priceOptions')})</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedItem.prices.map((p) => {
                        const isSelected = selectedVariant?.id === p.id
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedVariant(p)}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50/90 ring-2 ring-orange-500/25 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-black truncate pr-1 ${isSelected ? 'text-orange-950' : 'text-slate-900'}`}>
                                {p.name}
                              </span>
                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-orange-600 bg-orange-600' : 'border-slate-300'
                              }`}>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                              </span>
                            </div>
                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className={`text-base font-black ${isSelected ? 'text-orange-600' : 'text-slate-900'}`}>
                                ${parseFloat(p.price).toFixed(2)}
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                ({(Math.round(parseFloat(p.price) * 4000)).toLocaleString()} ៛)
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Special Instructions Note Field */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {t('specialInstructionsOptional')}
                  </label>
                  <input
                    type="text"
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder={t('specialInstructionsPlaceholder')}
                    maxLength={150}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200">
                  <button
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    disabled={modalQuantity <= 1}
                    className="w-8 h-8 rounded-full bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40 shadow-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-slate-900">
                    {modalQuantity}
                  </span>
                  <button
                    onClick={() => setModalQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-full bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-orange-50 hover:text-orange-600 shadow-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleModalAdd}
                  disabled={!selectedItem.is_available}
                  className="flex-1 py-3 px-5 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold text-sm shadow-md shadow-orange-500/25 hover:shadow-lg active:scale-98 disabled:opacity-50 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{t('addToOrder')}</span>
                  <span>${(((selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(selectedItem.price))) * modalQuantity).toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Menu

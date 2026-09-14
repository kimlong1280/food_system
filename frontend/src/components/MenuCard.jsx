import { FiPlus, FiCheck } from 'react-icons/fi'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const MenuCard = ({ item, onSelect, onQuickAdd }) => {
  const [justAdded, setJustAdded] = useState(false)
  const { t, translateType } = useLanguage()

  const hasMultiplePrices = item.has_multiple_prices || (item.prices && item.prices.length > 1)

  // Track customer's selected option on the card (defaults to item's default or first variant)
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (item.prices && item.prices.length > 0) {
      return item.prices.find((p) => p.is_default) || item.prices[0]
    }
    return null
  })

  const handleAdd = (e) => {
    e.stopPropagation()
    if (!item.is_available) return

    if (hasMultiplePrices) {
      const variantToOrder = selectedVariant || item.prices?.[0]
      onQuickAdd(item, variantToOrder)
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1200)
      return
    }

    onQuickAdd(item)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <div
      onClick={() => onSelect(item, selectedVariant)}
      className={`group relative bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer card-shimmer ${
        !item.is_available ? 'opacity-70' : 'hover:-translate-y-1.5'
      }`}
    >
      {/* Food Image Container */}
      <div className="relative w-full aspect-4/3 overflow-hidden bg-slate-100">
        <img
          src={
            item.image ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
          }
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Featured Tag */}
        {item.is_featured && item.is_available && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-xs inline-flex items-center gap-1">
            <i className="fi fi-sr-star text-[9px] text-amber-200" />
            <span>{t('popularTag')}</span>
          </div>
        )}

        {/* Unavailable Overlay */}
        {!item.is_available && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-2">
            <span className="px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold shadow-md tracking-wide uppercase">
              {t('soldOut')}
            </span>
          </div>
        )}

        {/* Type & Size Badges */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-white text-[10px] font-medium capitalize">
            {translateType(item.type)}
          </span>
          {hasMultiplePrices && (
            <span className="px-1.5 py-0.5 rounded-md bg-orange-600/80 backdrop-blur-xs text-white text-[9px] font-bold">
              {item.prices?.length} {t('sizesCount', { count: item.prices?.length || 2 })}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
            {item.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {item.description || t('defaultDishDesc')}
          </p>
        </div>

        {/* Interactive Option Selector: Normal $3, Special $5, Very Special $7 */}
        {hasMultiplePrices && item.prices && item.prices.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              {t('chooseOption') || 'Select Option'}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {item.prices.map((p) => {
                const isSelected = (selectedVariant?.id || item.prices[0]?.id) === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedVariant(p)
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-orange-600 text-white shadow-xs ring-2 ring-orange-500/25 scale-102'
                        : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                      ${parseFloat(p.price).toFixed(2)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Selected Price & Add to Cart Button */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base text-orange-600 leading-tight">
              {hasMultiplePrices && selectedVariant
                ? `$${parseFloat(selectedVariant.price).toFixed(2)}`
                : item.formatted_price || `$${parseFloat(item.price).toFixed(2)}`}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {hasMultiplePrices && selectedVariant
                ? `${(Math.round(parseFloat(selectedVariant.price) * 4000)).toLocaleString()} ៛`
                : item.formatted_price_khr || `${(parseFloat(item.price) * 4000).toLocaleString()} ៛`}
            </span>
          </div>

          {item.is_available ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={justAdded}
              className={`inline-flex items-center justify-center gap-1 h-8 px-3 rounded-full text-xs font-bold transition-all duration-200 active:scale-80 hover:scale-105 cursor-pointer ${
                justAdded
                  ? 'bg-emerald-600 text-white animate-pop shadow-md shadow-emerald-600/30'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white border border-orange-200/80 hover:border-orange-600 hover:shadow-md hover:shadow-orange-500/25'
              }`}
              aria-label={`Add ${item.name} to cart`}
            >
              {justAdded ? (
                <>
                  <FiCheck className="w-3.5 h-3.5" />
                  <span>{t('added')}</span>
                </>
              ) : (
                <>
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>{t('add')}</span>
                </>
              )}
            </button>
          ) : (
            <span className="text-xs font-medium text-slate-400">{t('unavailable')}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuCard

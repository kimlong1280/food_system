import { FiPlus, FiCheck } from 'react-icons/fi'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const MenuCard = ({ item, onSelect, onQuickAdd }) => {
  const [justAdded, setJustAdded] = useState(false)
  const { t, translateType } = useLanguage()

  const handleAdd = (e) => {
    e.stopPropagation()
    if (!item.is_available) return

    onQuickAdd(item)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <div
      onClick={() => onSelect(item)}
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

        {/* Type Badge */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-white text-[10px] font-medium capitalize">
          {translateType(item.type)}
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

        {/* Price & Add to Cart Button */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
          <span className="font-extrabold text-sm sm:text-base text-orange-600">
            {item.formatted_price || `$${parseFloat(item.price).toFixed(2)}`}
          </span>

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

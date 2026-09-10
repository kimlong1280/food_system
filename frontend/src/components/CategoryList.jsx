import { useLanguage } from '../context/LanguageContext'

const CategoryList = ({ categories = [], selectedCategory, onSelectCategory }) => {
  const { t, translateCategory } = useLanguage()

  const getCategoryIcon = (name) => {
    switch (name) {
      case 'Food':
        return <i className="fi fi-sr-burger-alt" />
      case 'Drinks':
        return <i className="fi fi-sr-drink-alt" />
      case 'Coffee':
        return <i className="fi fi-sr-coffee" />
      case 'Dessert':
        return <i className="fi fi-sr-cake-slice" />
      case 'Soup':
        return <i className="fi fi-sr-soup" />
      default:
        return <i className="fi fi-sr-restaurant" />
    }
  }

  return (
    <div className="w-full py-1">
      {/* 
        Smartphone Responsive Grid: 
        - 3 columns on small phones (<420px)
        - 4 columns on larger phones (420px+)
        - Drops down to a new line under it cleanly
        - Flex-wrap pills on tablet/desktop (sm+)
      */}
      <div className="grid grid-cols-3 min-[420px]:grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-2.5">
        {/* All Items Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer text-center ${
            selectedCategory === null
              ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400/40 scale-[1.02]'
              : 'bg-white text-slate-700 border border-slate-200/90 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/40 shadow-2xs'
          }`}
        >
          <i className="fi fi-sr-sparkles text-[11px] shrink-0" />
          <span className="truncate">{t('allCategory')}</span>
        </button>

        {/* Popular Dishes Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory('popular')}
          className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer text-center ${
            selectedCategory === 'popular'
              ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400/40 scale-[1.02]'
              : 'bg-white text-slate-700 border border-slate-200/90 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/40 shadow-2xs'
          }`}
        >
          <i className="fi fi-sr-flame text-amber-500 text-[11px] shrink-0" />
          <span className="truncate">{t('types.popular')}</span>
        </button>

        {/* Dynamic Categories */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id
          const localizedName = translateCategory(cat.name)

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2 px-2 sm:px-4 rounded-xl sm:rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer text-center ${
                isSelected
                  ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400/40 scale-[1.02]'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/40 shadow-2xs'
              }`}
            >
              <span className="text-xs shrink-0 flex items-center">
                {getCategoryIcon(cat.name)}
              </span>
              <span className="truncate">{localizedName}</span>
              {cat.menu_items_count !== undefined && (
                <span
                  className={`hidden min-[380px]:inline-flex text-[9px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                    isSelected
                      ? 'bg-orange-800/40 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cat.menu_items_count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryList

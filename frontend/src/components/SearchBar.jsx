import { FiSearch, FiX } from 'react-icons/fi'
import { useLanguage } from '../context/LanguageContext'

const SearchBar = ({ value, onChange, onClear, placeholder }) => {
  const { t } = useLanguage()
  const displayPlaceholder = placeholder || t('searchPlaceholder')

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <FiSearch className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={displayPlaceholder}
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:ring-3 focus:ring-orange-500/15 transition-all shadow-2xs"
      />

      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default SearchBar

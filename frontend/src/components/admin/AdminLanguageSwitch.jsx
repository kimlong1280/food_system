import { useLanguage } from '../../context/LanguageContext'

export const AdminLanguageSwitch = ({ variant = 'header', className = '' }) => {
  const { language, setLanguage } = useLanguage()

  if (variant === 'sidebar') {
    return (
      <div className={`flex items-center justify-between p-2 rounded-xl bg-slate-800/70 border border-slate-700/50 ${className}`}>
        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
          <span>🌐</span>
          <span>{language === 'km' ? 'ភាសា' : 'Language'}</span>
        </span>
        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/70 text-xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('km')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              language === 'km'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ខ្មែរ
          </button>
        </div>
      </div>
    )
  }

  // Header and default variant (Clean, high-visibility segmented pill)
  return (
    <div
      className={`inline-flex items-center bg-slate-100 hover:bg-slate-200/70 p-0.5 rounded-full border border-slate-200/80 text-xs shadow-2xs transition-colors ${className}`}
      title={language === 'en' ? 'ប្តូរទៅភាសាខ្មែរ (Switch to Khmer)' : 'Switch to English'}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
          language === 'en'
            ? 'bg-white text-orange-600 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span className="w-3.5 h-2.5 inline-block rounded-2xs overflow-hidden shadow-2xs bg-slate-200 shrink-0">
          <svg viewBox="0 0 60 30" className="w-full h-full object-cover">
            <clipPath id="uk-flag-adm">
              <path d="M0,0 v30 h60 v-30 z" />
            </clipPath>
            <clipPath id="uk-diag-adm">
              <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
            </clipPath>
            <g clipPath="url(#uk-flag-adm)">
              <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
              <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
              <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-diag-adm)" stroke="#C8102E" strokeWidth="4" />
              <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
              <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
            </g>
          </svg>
        </span>
        <span>EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('km')}
        className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[11px] ${
          language === 'km'
            ? 'bg-white text-orange-600 shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span className="w-3.5 h-2.5 inline-block rounded-2xs overflow-hidden shadow-2xs bg-slate-200 shrink-0">
          <svg viewBox="0 0 60 40" className="w-full h-full object-cover">
            <rect width="60" height="40" fill="#032ea1" />
            <rect y="10" width="60" height="20" fill="#e00025" />
            <path d="M24,25 h12 v-1 h-1.5 v-5 h-1.5 v5 h-2 v-6 h-2 v6 h-2 v-5 h-1.5 v5 h-1.5 z" fill="#fff" />
          </svg>
        </span>
        <span>ខ្មែរ</span>
      </button>
    </div>
  )
}

export default AdminLanguageSwitch

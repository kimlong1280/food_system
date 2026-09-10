import { useLocation, Link } from 'react-router-dom'
import { FiAlertTriangle, FiSmartphone } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'

const TableError = () => {
  const location = useLocation()
  const { t } = useLanguage()

  const message = location.state?.message || t('tableDefaultErrorMessage')

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-6 shadow-sm">
        <FiAlertTriangle className="w-10 h-10" />
      </div>

      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
        {t('tableScanRequired')}
      </span>

      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-3 max-w-sm">
        {t('unableToIdentifyTable')}
      </h1>

      <p className="text-sm text-slate-600 max-w-md mb-8 leading-relaxed">
        {message}
      </p>

      <div className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-8 text-left">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          {t('howToOrder')}
        </h4>
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>{t('step1')}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>{t('step2')}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>{t('step3')}</span>
          </li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/menu"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all"
        >
          <FiSmartphone className="w-4 h-4" />
          <span>{t('browseSampleMenu')}</span>
        </Link>
      </div>
    </div>
  )
}

export default TableError

import { FiAlertTriangle } from 'react-icons/fi'
import Modal from './Modal'
import { useLanguage } from '../../context/LanguageContext'

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  loading = false,
}) => {
  const { t } = useLanguage()

  const dialogTitle = title || t('confirmDeletion')
  const dialogMessage = message || t('confirmDeleteDefaultMsg')
  const dialogConfirmText = confirmText || t('delete')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={dialogTitle} maxWidth="max-w-sm">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl mx-auto flex items-center justify-center text-2xl border border-rose-100 shadow-inner">
          <FiAlertTriangle className="w-7 h-7" />
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">{dialogMessage}</p>

        <div className="flex items-center justify-center gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            {loading ? t('deleting') : dialogConfirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog

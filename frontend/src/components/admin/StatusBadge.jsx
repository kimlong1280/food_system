import { useLanguage } from '../../context/LanguageContext'

const StatusBadge = ({ status, className = '' }) => {
  const { t } = useLanguage()

  const configs = {
    pending: {
      label: t('statusPending'),
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    confirmed: {
      label: t('statusConfirmed'),
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
    },
    preparing: {
      label: t('statusPreparing'),
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500 animate-pulse',
    },
    ready: {
      label: t('statusReady'),
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-500',
    },
    served: {
      label: t('statusServed'),
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
    },
    completed: {
      label: t('statusCompleted'),
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    cancelled: {
      label: t('statusCancelled'),
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    active: {
      label: t('statusActive'),
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    inactive: {
      label: t('statusInactive'),
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
    },
    occupied: {
      label: t('statusOccupied'),
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500 animate-ping',
    },
    available: {
      label: t('statusAvailable'),
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
  }

  const current = configs[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide uppercase text-[10px] ${current.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      <span>{current.label}</span>
    </span>
  )
}

export default StatusBadge

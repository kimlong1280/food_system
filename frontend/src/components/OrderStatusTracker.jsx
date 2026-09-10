import { useMemo } from 'react'
import {
  FiCheck,
  FiXCircle,
  FiRefreshCw,
} from 'react-icons/fi'
import { useLanguage } from '../context/LanguageContext'

const OrderStatusTracker = ({ order, onRefresh, refreshing, lastUpdatedTime }) => {
  const { t } = useLanguage()

  const status = order?.status || 'pending'

  // Map backend status enum to step progression (1 to 5)
  // 'pending' -> step 1
  // 'confirmed' -> step 2
  // 'preparing' -> step 2
  // 'ready' -> step 3
  // 'served' -> step 4
  // 'completed' -> step 5
  // 'cancelled' -> special cancelled state
  const currentStep = useMemo(() => {
    switch (status) {
      case 'pending':
        return 1
      case 'confirmed':
        return 2
      case 'preparing':
        return 2
      case 'ready':
        return 3
      case 'served':
        return 4
      case 'completed':
        return 5
      case 'cancelled':
        return -1
      default:
        return 1
    }
  }, [status])

  const steps = [
    {
      step: 1,
      title: t('statusPlacedTitle'),
      desc: t('statusPlacedDesc'),
      icon: 'fi-sr-document',
    },
    {
      step: 2,
      title: status === 'confirmed' ? t('statusConfirmedTitle') : t('statusPreparingTitle'),
      desc: status === 'confirmed' ? t('statusConfirmedDesc') : t('statusPreparingDesc'),
      icon: 'fi-sr-pot',
    },
    {
      step: 3,
      title: t('statusReadyTitle'),
      desc: t('statusReadyDesc'),
      icon: 'fi-sr-bell-ring',
    },
    {
      step: 4,
      title: t('statusServedTitle'),
      desc: t('statusServedDesc'),
      icon: 'fi-sr-check',
    },
  ]

  // If order was cancelled
  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-5 sm:p-6 text-red-800 space-y-3 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0">
            <FiXCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-red-900">{t('statusCancelledTitle')}</h3>
            <p className="text-xs text-red-700 mt-0.5">{t('statusCancelledDesc')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Active status color schemes
  const getStatusColorConfig = () => {
    switch (status) {
      case 'pending':
        return {
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          dotBg: 'bg-amber-500',
          title: t('statusPlacedTitle'),
          desc: t('statusPlacedDesc'),
        }
      case 'confirmed':
        return {
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          dotBg: 'bg-blue-500',
          title: t('statusConfirmedTitle'),
          desc: t('statusConfirmedDesc'),
        }
      case 'preparing':
        return {
          badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
          dotBg: 'bg-orange-500',
          title: t('statusPreparingTitle'),
          desc: t('statusPreparingDesc'),
        }
      case 'ready':
        return {
          badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
          dotBg: 'bg-purple-500',
          title: t('statusReadyTitle'),
          desc: t('statusReadyDesc'),
        }
      case 'served':
        return {
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dotBg: 'bg-emerald-500',
          title: t('statusServedTitle'),
          desc: t('statusServedDesc'),
        }
      case 'completed':
        return {
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
          dotBg: 'bg-slate-500',
          title: t('statusCompletedTitle'),
          desc: t('statusCompletedDesc'),
        }
      default:
        return {
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
          dotBg: 'bg-slate-500',
          title: status,
          desc: '',
        }
    }
  }

  const activeConfig = getStatusColorConfig()
  const progressPercent = Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md shadow-slate-100 space-y-5 animate-scale-in">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
            {t('realTimeOrderStatus')}
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold hidden xs:inline">
            {t('liveStatusUpdating')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdatedTime && (
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              {t('lastUpdated', { time: lastUpdatedTime })}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Refresh status"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Active Status Hero Card */}
      <div className={`p-4 rounded-2xl border ${activeConfig.badgeBg} flex items-start gap-3 transition-all duration-300`}>
        <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center shrink-0 mt-0.5">
          <span className={`w-3.5 h-3.5 rounded-full ${activeConfig.dotBg} animate-pulse`} />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-wider opacity-70">
              {t('currentStatus')}
            </span>
            <span className="font-black text-xs sm:text-sm tracking-tight">
              • {activeConfig.title}
            </span>
          </div>
          <p className="text-xs opacity-90 leading-relaxed">
            {activeConfig.desc}
          </p>
        </div>
      </div>

      {/* Visual Stepper Pipeline */}
      <div className="pt-2">
        {/* Horizontal Stepper (Tablet & Desktop) */}
        <div className="relative hidden sm:block">
          {/* Connector Track */}
          <div className="absolute top-5 inset-x-8 h-1 bg-slate-100 rounded-full z-0">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-4 relative z-10">
            {steps.map((item) => {
              const isPast = currentStep > item.step
              const isCurrent = currentStep === item.step

              return (
                <div key={item.step} className="flex flex-col items-center text-center px-1">
                  {/* Circle Node */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                        : isCurrent
                        ? 'bg-orange-600 text-white ring-4 ring-orange-200/80 shadow-orange-600/30 scale-110 animate-pulse-glow'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isPast ? (
                      <FiCheck className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <i className={`fi ${item.icon} text-sm leading-none`} />
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="mt-2.5 space-y-0.5">
                    <p
                      className={`text-xs font-extrabold ${
                        isCurrent
                          ? 'text-orange-600'
                          : isPast
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-[10px] text-slate-400 max-w-[110px] mx-auto leading-tight line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Vertical Stepper (Mobile Phones) */}
        <div className="sm:hidden space-y-3">
          {steps.map((item, index) => {
            const isPast = currentStep > item.step
            const isCurrent = currentStep === item.step
            const isLast = index === steps.length - 1

            return (
              <div key={item.step} className="flex items-start gap-3 relative">
                {/* Vertical Line Connector */}
                {!isLast && (
                  <span
                    className={`absolute left-4.5 top-9 bottom-0 w-0.5 -ml-[1px] transition-colors duration-500 ${
                      isPast ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all shadow-xs ${
                    isPast
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-orange-600 text-white ring-3 ring-orange-200 scale-105 animate-pulse-glow'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isPast ? (
                    <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <i className={`fi ${item.icon} text-xs leading-none`} />
                  )}
                </div>

                {/* Step Content */}
                <div className="min-w-0 pt-0.5 pb-2">
                  <p
                    className={`text-xs font-black ${
                      isCurrent
                        ? 'text-orange-600'
                        : isPast
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OrderStatusTracker

const StatsCard = ({
  title,
  value,
  khrValue,
  subtext,
  icon,
  trend,
  badge,
  color = 'orange',
}) => {
  const colorSchemes = {
    orange: {
      bg: 'from-orange-500/10 via-orange-500/5 to-amber-500/5',
      border: 'border-orange-200/80',
      iconBg: 'bg-orange-500 text-white shadow-orange-500/25',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    blue: {
      bg: 'from-blue-500/10 via-blue-500/5 to-indigo-500/5',
      border: 'border-blue-200/80',
      iconBg: 'bg-blue-500 text-white shadow-blue-500/25',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    emerald: {
      bg: 'from-emerald-500/10 via-emerald-500/5 to-teal-500/5',
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-500 text-white shadow-emerald-500/25',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    purple: {
      bg: 'from-purple-500/10 via-purple-500/5 to-pink-500/5',
      border: 'border-purple-200/80',
      iconBg: 'bg-purple-500 text-white shadow-purple-500/25',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    amber: {
      bg: 'from-amber-500/10 via-amber-500/5 to-yellow-500/5',
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/25',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  }

  const scheme = colorSchemes[color] || colorSchemes.orange

  return (
    <div
      className={`relative bg-gradient-to-br ${scheme.bg} bg-white rounded-3xl p-5 border ${scheme.border} shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5 duration-200`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{title}</p>
            {badge && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${scheme.badgeBg}`}>
                {badge}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
            {khrValue && (
              <span className="text-xs font-black text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-lg border border-orange-200/60">
                {khrValue}
              </span>
            )}
          </div>
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md shrink-0 ${scheme.iconBg}`}
        >
          {icon}
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium truncate">{subtext}</span>
          {trend && <span className="font-extrabold text-emerald-600 shrink-0">{trend}</span>}
        </div>
      )}
    </div>
  )
}

export default StatsCard

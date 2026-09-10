const StatsCard = ({ title, value, subtext, icon, trend, color = 'orange' }) => {
  const colorSchemes = {
    orange: {
      bg: 'from-orange-500/10 to-amber-500/5',
      border: 'border-orange-200/80',
      iconBg: 'bg-orange-500 text-white shadow-orange-500/25',
    },
    blue: {
      bg: 'from-blue-500/10 to-indigo-500/5',
      border: 'border-blue-200/80',
      iconBg: 'bg-blue-500 text-white shadow-blue-500/25',
    },
    emerald: {
      bg: 'from-emerald-500/10 to-teal-500/5',
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-500 text-white shadow-emerald-500/25',
    },
    purple: {
      bg: 'from-purple-500/10 to-pink-500/5',
      border: 'border-purple-200/80',
      iconBg: 'bg-purple-500 text-white shadow-purple-500/25',
    },
  }

  const scheme = colorSchemes[color] || colorSchemes.orange

  return (
    <div
      className={`relative bg-gradient-to-br ${scheme.bg} bg-white rounded-2xl p-5 border ${scheme.border} shadow-xs flex flex-col justify-between transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md ${scheme.iconBg}`}
        >
          {icon}
        </div>
      </div>

      {(subtext || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">{subtext}</span>
          {trend && <span className="font-bold text-emerald-600">{trend}</span>}
        </div>
      )}
    </div>
  )
}

export default StatsCard

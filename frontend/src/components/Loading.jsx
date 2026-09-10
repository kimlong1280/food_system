export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-orange-500 border-t-transparent ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export const PageLoading = ({ text = 'Loading delicious menu...' }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
          <i className="fi fi-sr-restaurant text-2xl text-orange-600" />
        </div>
        <div className="absolute -bottom-1 -right-1">
          <Spinner size="sm" />
        </div>
      </div>
      <p className="text-slate-600 font-medium text-sm animate-pulse">{text}</p>
    </div>
  )
}

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 animate-pulse">
      <div className="w-full h-40 bg-slate-200 rounded-xl mb-3"></div>
      <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded-md w-1/2 mb-4"></div>
      <div className="flex justify-between items-center">
        <div className="h-5 bg-slate-200 rounded-md w-1/4"></div>
        <div className="h-8 bg-slate-200 rounded-full w-20"></div>
      </div>
    </div>
  )
}

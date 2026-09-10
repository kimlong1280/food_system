import { Link } from 'react-router-dom'

const EmptyState = ({
  icon,
  title = 'No items found',
  description = 'Try adjusting your search or filter to find what you are craving.',
  actionText,
  actionLink,
  onAction,
}) => {
  const renderIcon = () => {
    if (!icon) {
      return <i className="fi fi-sr-restaurant text-3xl" />
    }
    if (typeof icon === 'string') {
      if (icon.startsWith('fi-') || icon.startsWith('fi ')) {
        return <i className={`${icon} text-3xl`} />
      }
      if (icon === '🔍') {
        return <i className="fi fi-sr-search text-3xl" />
      }
      if (icon === '🛒') {
        return <i className="fi fi-sr-shopping-cart text-3xl" />
      }
      return <i className="fi fi-sr-restaurant text-3xl" />
    }
    return icon
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">{description}</p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          {actionText}
        </Link>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}

export default EmptyState

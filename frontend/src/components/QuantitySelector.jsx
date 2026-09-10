import { FiMinus, FiPlus } from 'react-icons/fi'

const QuantitySelector = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  size = 'md',
  className = '',
}) => {
  const sizeConfig = {
    sm: {
      btn: 'w-6 h-6 text-xs',
      text: 'w-7 text-xs font-semibold',
      container: 'p-0.5',
    },
    md: {
      btn: 'w-8 h-8 text-sm',
      text: 'w-9 text-sm font-bold',
      container: 'p-1',
    },
    lg: {
      btn: 'w-10 h-10 text-base',
      text: 'w-12 text-base font-bold',
      container: 'p-1.5',
    },
  }

  const currentSize = sizeConfig[size] || sizeConfig.md

  return (
    <div
      className={`inline-flex items-center bg-slate-100 rounded-full border border-slate-200/80 shadow-inner ${currentSize.container} ${className}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= min}
        className={`${currentSize.btn} rounded-full flex items-center justify-center bg-white text-slate-700 shadow-xs hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 active:scale-90 transition-all`}
        aria-label="Decrease quantity"
      >
        <FiMinus />
      </button>

      <span className={`${currentSize.text} text-center text-slate-900 select-none`}>
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= max}
        className={`${currentSize.btn} rounded-full flex items-center justify-center bg-white text-slate-700 shadow-xs hover:bg-orange-50 hover:text-orange-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-700 active:scale-90 transition-all`}
        aria-label="Increase quantity"
      >
        <FiPlus />
      </button>
    </div>
  )
}

export default QuantitySelector

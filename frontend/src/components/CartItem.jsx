import { useState } from 'react'
import { FiTrash2, FiEdit3, FiCheck } from 'react-icons/fi'
import QuantitySelector from './QuantitySelector'
import { useLanguage } from '../context/LanguageContext'

const CartItem = ({ item, onUpdateQuantity, onUpdateNote, onRemove }) => {
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [tempNote, setTempNote] = useState(item.note || '')
  const { t } = useLanguage()

  const handleSaveNote = () => {
    onUpdateNote(item.id, tempNote)
    setIsEditingNote(false)
  }

  const lineTotal = (item.price * item.quantity).toFixed(2)

  return (
    <div className="group bg-white rounded-2xl p-3.5 border border-slate-100 hover:border-orange-200/80 shadow-2xs hover:shadow-md transition-all duration-200">
      <div className="flex gap-3">
        {/* Item Thumbnail */}
        <div className="w-18 h-18 rounded-xl overflow-hidden bg-slate-100 shrink-0">
          <img
            src={
              item.image ||
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80'
            }
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Item Information */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</h4>
              {item.variant_name && (
                <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-extrabold">
                  {item.variant_name}
                </span>
              )}
              <p className="text-xs text-orange-600 font-semibold mt-0.5">
                ${item.price.toFixed(2)} / {t('each')}
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemove(item.id)}
              className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
              aria-label="Remove item from cart"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Controls: Quantity & Line Subtotal */}
          <div className="flex items-center justify-between mt-2">
            <QuantitySelector
              quantity={item.quantity}
              onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)}
              onDecrease={() => onUpdateQuantity(item.id, item.quantity - 1)}
              size="sm"
            />

            <span className="font-bold text-sm text-slate-900">${lineTotal}</span>
          </div>
        </div>
      </div>

      {/* Special Instruction Note */}
      <div className="mt-2.5 pt-2 border-t border-slate-100">
        {isEditingNote ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              placeholder={t('specialInstructionsPlaceholder')}
              maxLength={150}
              className="flex-1 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-orange-500"
              autoFocus
            />
            <button
              onClick={handleSaveNote}
              className="p-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer"
              aria-label="Save note"
            >
              <FiCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            {item.note ? (
              <p className="text-slate-600 italic line-clamp-1">
                <span className="font-medium text-slate-400 not-italic">{t('note')}:</span> {item.note}
              </p>
            ) : (
              <span className="text-slate-400 italic">{t('noSpecialInstructions')}</span>
            )}
            <button
              onClick={() => {
                setTempNote(item.note || '')
                setIsEditingNote(true)
              }}
              className="text-orange-600 hover:text-orange-700 font-medium inline-flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
            >
              <FiEdit3 className="w-3 h-3" />
              <span>{item.note ? t('edit') : t('addNote')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartItem

import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import CartItem from '../../components/CartItem'
import EmptyState from '../../components/EmptyState'

const Cart = () => {
  const navigate = useNavigate()
  const {
    table,
    cartItems,
    cartSubtotal,
    updateQuantity,
    updateItemNote,
    removeFromCart,
    clearCart,
  } = useCart()
  const { t } = useLanguage()

  if (cartItems.length === 0) {
    return (
      <div className="pt-8">
        <EmptyState
          icon="fi fi-sr-shopping-cart"
          title={t('yourCartIsEmpty')}
          description={t('emptyCartDesc')}
          actionText={t('browseMenu')}
          actionLink="/menu"
        />
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-5 animate-slide-up">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/menu')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200/80 shadow-2xs hover:bg-slate-50 hover:border-orange-300 hover:text-orange-600 transition-all cursor-pointer"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          <span>{t('continueOrdering')}</span>
        </button>

        <button
          onClick={clearCart}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors cursor-pointer"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          <span>{t('clearCart')}</span>
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start space-y-5 lg:space-y-0">
        {/* Left Column: Table banner + Cart Items List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Table Notice Banner */}
          <div className="flex items-center justify-between p-3.5 bg-orange-50/80 border border-orange-200/80 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-sm shrink-0">
                <i className="fi fi-sr-chair" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {table ? t('orderingForTable', { number: table.table_number }) : t('noTableAssigned')}
                </p>
                <p className="text-[11px] text-slate-500">
                  {t('deliveredDirectly')}
                </p>
              </div>
            </div>
            {table && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {t('active')}
              </span>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              {t('orderedItems', { count: cartItems.length })}
            </h3>

            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onUpdateNote={updateItemNote}
                onRemove={removeFromCart}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Sticky Summary & Checkout on tablet/desktop */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 lg:sticky lg:top-20">
          {/* Subtotal Summary Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('subtotal')}
            </h3>
            <div className="flex justify-between text-xs text-slate-600">
              <span>{t('subtotal')}</span>
              <span className="font-semibold text-slate-900">${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>{t('taxesAndService')}</span>
              <span className="font-semibold text-emerald-600">{t('included')}</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-lg font-black text-slate-900">
              <span>{t('totalAmount')}</span>
              <span className="text-orange-600">${cartSubtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Proceed to Checkout Button */}
          <div>
            <button
              onClick={() => navigate('/checkout')}
              className="group w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white font-extrabold text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-between cursor-pointer animate-pulse-glow"
            >
              <div className="flex items-center gap-2">
                <FiShoppingBag className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span>{t('reviewAndPlaceOrder')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>${cartSubtotal.toFixed(2)}</span>
                <FiArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart

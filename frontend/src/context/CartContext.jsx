import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  // Table State
  const [table, setTable] = useState(() => {
    try {
      const saved = localStorage.getItem('restaurant_current_table')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Cart Items State
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('restaurant_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Customer Name and Order Note
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('restaurant_customer_name') || '')
  const [orderNote, setOrderNote] = useState('')

  // Persist table
  useEffect(() => {
    if (table) {
      localStorage.setItem('restaurant_current_table', JSON.stringify(table))
    }
  }, [table])

  // Persist cart items
  useEffect(() => {
    localStorage.setItem('restaurant_cart', JSON.stringify(cartItems))
  }, [cartItems])

  // Persist customer name
  useEffect(() => {
    if (customerName) {
      localStorage.setItem('restaurant_customer_name', customerName)
    }
  }, [customerName])

  const setTableInfo = useCallback((tableData) => {
    if (!tableData) {
      setTable(null)
      localStorage.removeItem('restaurant_current_table')
      return
    }
    setTable({
      id: tableData.id,
      table_number: tableData.table_number,
      name: tableData.name,
      status: tableData.status,
    })
  }, [])

  // Add item to cart
  const addToCart = (menuItem, quantity = 1, note = '', selectedVariant = null) => {
    // Resolve variant details if provided or if item has multiple prices
    let variantId = selectedVariant?.id || null
    let variantName = selectedVariant?.name || null
    let unitPrice = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(menuItem.price)

    // Fallback: If no variant explicitly passed but item has prices
    if (!selectedVariant && menuItem.prices && menuItem.prices.length > 0) {
      const defaultVar = menuItem.prices.find((p) => p.is_default) || menuItem.prices[0]
      if (defaultVar) {
        variantId = defaultVar.id
        variantName = defaultVar.name
        unitPrice = parseFloat(defaultVar.price)
      }
    }

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.menu_item_id === menuItem.id &&
          (i.menu_item_price_id || null) === (variantId || null) &&
          (i.note || '') === (note || '')
      )

      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        }
        return updated
      }

      return [
        ...prev,
        {
          id: `${menuItem.id}-${variantId || 'base'}-${Date.now()}`,
          menu_item_id: menuItem.id,
          menu_item_price_id: variantId,
          variant_name: variantName,
          name: menuItem.name,
          price: unitPrice,
          image: menuItem.image,
          type: menuItem.type,
          quantity: Math.max(1, quantity),
          note: note || '',
        },
      ]
    })
  }

  // Update item quantity
  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  // Update special instructions / note for single item
  const updateItemNote = (cartItemId, note) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === cartItemId ? { ...item, note } : item
      )
    )
  }

  // Remove single item from cart
  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId))
  }

  // Clear entire cart
  const clearCart = () => {
    setCartItems([])
    setOrderNote('')
    localStorage.removeItem('restaurant_cart')
  }

  // Calculations
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        table,
        setTableInfo,
        cartItems,
        customerName,
        setCustomerName,
        orderNote,
        setOrderNote,
        addToCart,
        updateQuantity,
        updateItemNote,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

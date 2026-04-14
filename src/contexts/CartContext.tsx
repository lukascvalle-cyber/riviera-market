import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { CartItem, Product } from '../types'

interface CartContextValue {
  items: CartItem[]
  vendorId: string | null
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [vendorId, setVendorId] = useState<string | null>(null)

  const addItem = useCallback((product: Product) => {
    setVendorId(product.vendor_id)
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.product.id !== productId)
      if (next.length === 0) setVendorId(null)
      return next
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems(prev =>
      prev.map(i => (i.product.id === productId ? { ...i, quantity } : i)),
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    setVendorId(null)
  }, [])

  const total = items.reduce((sum, i) => sum + i.product.price_brl * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, vendorId, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

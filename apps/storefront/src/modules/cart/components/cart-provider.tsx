"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react"
import { HttpTypes } from "@medusajs/types"

import {
  addToCart as addToCartAction,
  deleteLineItem as deleteLineItemAction,
  retrieveCart,
  updateLineItem as updateLineItemAction,
} from "@/lib/data/cart"
import { formatPrice } from "@/lib/prices"

type CartContextValue = {
  cart: HttpTypes.StoreCart | null
  loading: boolean
  adding: boolean
  itemCount: number
  subtotal: string
  currencyCode: string
  addItem: (variantId: string, quantity: number) => Promise<void>
  updateItem: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({
  children,
  initialCart,
}: {
  children: React.ReactNode
  initialCart: HttpTypes.StoreCart | null
}) {
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(initialCart)
  const [adding, setAdding] = useState(false)
  const [, startTransition] = useTransition()

  const refreshCart = useCallback(async () => {
    const next = await retrieveCart()
    setCart(next)
  }, [])

  const addItem = useCallback(
    async (variantId: string, quantity: number) => {
      setAdding(true)
      try {
        await addToCartAction({ variantId, quantity })
        await refreshCart()
      } finally {
        setAdding(false)
      }
    },
    [refreshCart]
  )

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      // Optimistic update on quantity
      setCart((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: (prev.items ?? []).map((it) =>
            it.id === lineItemId ? { ...it, quantity } : it
          ),
        } as HttpTypes.StoreCart
      })
      startTransition(async () => {
        await updateLineItemAction({ lineId: lineItemId, quantity })
        await refreshCart()
      })
    },
    [refreshCart]
  )

  const removeItem = useCallback(
    async (lineItemId: string) => {
      // Optimistic remove
      setCart((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          items: (prev.items ?? []).filter((it) => it.id !== lineItemId),
        } as HttpTypes.StoreCart
      })
      startTransition(async () => {
        await deleteLineItemAction(lineItemId)
        await refreshCart()
      })
    },
    [refreshCart]
  )

  const itemCount = useMemo(() => {
    if (!cart?.items) return 0
    return cart.items.reduce(
      (sum: number, item: HttpTypes.StoreCartLineItem) => sum + item.quantity,
      0
    )
  }, [cart])

  const currencyCode = cart?.currency_code ?? "eur"

  const subtotal = useMemo(() => {
    if (!cart) return formatPrice(0, "eur")
    const raw = cart.item_subtotal ?? 0
    return formatPrice(raw, currencyCode)
  }, [cart, currencyCode])

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading: false,
      adding,
      itemCount,
      subtotal,
      currencyCode,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    }),
    [
      cart,
      adding,
      itemCount,
      subtotal,
      currencyCode,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>")
  }
  return ctx
}

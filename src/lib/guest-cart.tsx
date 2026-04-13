"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ============================================================
// TYPES
// ============================================================

export type GuestCartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  // Denormalized product info for display (enriched client-side)
  name: string;
  slug: string;
  sellingPrice: number;
  comparePrice?: number | null;
  image?: string | null;
  quantityInStock: number;
  variantName?: string | null;
};

type GuestCartContextType = {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const STORAGE_KEY = "ms_guest_cart";

// ============================================================
// CONTEXT
// ============================================================

const GuestCartContext = createContext<GuestCartContextType | null>(null);

export function useGuestCart() {
  const ctx = useContext(GuestCartContext);
  if (!ctx) {
    throw new Error("useGuestCart must be used within a GuestCartProvider");
  }
  return ctx;
}

// ============================================================
// PROVIDER
// ============================================================

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: GuestCartItem) => {
    setItems((prev) => {
      const key = `${item.productId}:${item.variantId || ""}`;
      const existing = prev.find(
        (i) => `${i.productId}:${i.variantId || ""}` === key
      );

      if (existing) {
        return prev.map((i) =>
          `${i.productId}:${i.variantId || ""}` === key
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      return [item, ...prev];
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, variantId: string | undefined, quantity: number) => {
      setItems((prev) => {
        if (quantity <= 0) {
          return prev.filter(
            (i) =>
              !(i.productId === productId && (i.variantId || "") === (variantId || ""))
          );
        }
        return prev.map((i) =>
          i.productId === productId && (i.variantId || "") === (variantId || "")
            ? { ...i, quantity }
            : i
        );
      });
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, variantId?: string) => {
      setItems((prev) =>
        prev.filter(
          (i) =>
            !(i.productId === productId && (i.variantId || "") === (variantId || ""))
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + i.sellingPrice * i.quantity,
    0
  );

  return (
    <GuestCartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </GuestCartContext.Provider>
  );
}

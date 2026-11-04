import { create } from "zustand";

export interface CartItem {
  id: string;
  quantity: number;
  productId: string;
  variantId: string | null;
  product: {
    id: string;
    nameUk: string;
    nameEn: string;
    slug: string;
    price: number;
    discountPrice: number | null;
    images: { url: string; altText: string | null }[];
  };
  variant: {
    id: string;
    size: string;
    colorUk: string | null;
    colorEn: string | null;
  } | null;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  setCart: (items: CartItem[]) => void;
  setLoading: (loading: boolean) => void;
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemId: (oldId: string, newId: string) => void;
  clear: () => void;
}

export const selectCartCount = (state: CartState) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state: CartState) =>
  state.items.reduce(
    (sum, item) => sum + (item.product.discountPrice ?? item.product.price) * item.quantity,
    0,
  );

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isLoading: false,

  setCart: (items) => set({ items }),
  setLoading: (isLoading) => set({ isLoading }),

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId,
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i,
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  updateItemId: (oldId, newId) =>
    set((state) => ({
      items: state.items.map((i) => (i.id === oldId ? { ...i, id: newId } : i)),
    })),

  removeItem: (cartItemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== cartItemId),
    })),

  updateQuantity: (cartItemId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== cartItemId)
          : state.items.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)),
    })),

  clear: () => set({ items: [] }),
}));

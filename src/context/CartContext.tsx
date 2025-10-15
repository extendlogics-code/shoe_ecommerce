import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { Product, ProductSummary } from "../data/products";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartAction =
  | { type: "ADD_ITEM"; payload: { product: Product | ProductSummary; quantity?: number } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" };

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: []
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, quantity = 1 } = action.payload;
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          )
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity
          }
        ]
      };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((item) => item.id !== action.payload.id) };
    case "UPDATE_QUANTITY":
      return {
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        )
      };
    case "CLEAR_CART":
      return initialState;
    default:
      return state;
  }
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product | ProductSummary, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalItems = state.items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      items: state.items,
      subtotal,
      totalItems,
      addItem: (product, quantity = 1) => dispatch({ type: "ADD_ITEM", payload: { product, quantity } }),
      removeItem: (id: string) => dispatch({ type: "REMOVE_ITEM", payload: { id } }),
      updateQuantity: (id, quantity) =>
        dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity: Math.max(1, quantity) } }),
      clearCart: () => dispatch({ type: "CLEAR_CART" })
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

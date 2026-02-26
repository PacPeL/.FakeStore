import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const StoreContext = createContext(null);
const CART_KEY = "fakestore_cart_v1";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) ?? [];
  } catch {
    return [];
  }
}

const DEFAULT_SIZE = 40;

function normSize(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : DEFAULT_SIZE;
}

const initialState = {
  cart: loadCart(), // [{id,title,price,image,qty,size}]
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const p = action.payload;
      const size = normSize(p.size);

      // 🔥 match por id + size (para permitir mismo producto con tallas distintas)
      const found = state.cart.find((x) => x.id === p.id && normSize(x.size) === size);

      const cart = found
        ? state.cart.map((x) =>
            x.id === p.id && normSize(x.size) === size ? { ...x, qty: (x.qty ?? 0) + 1 } : x
          )
        : [...state.cart, { ...p, qty: 1, size }];

      return { ...state, cart };
    }

    case "REMOVE": {
      const { id, size } = action.payload;
      // remover específicamente por id + size
      return {
        ...state,
        cart: state.cart.filter((x) => !(x.id === id && normSize(x.size) === normSize(size))),
      };
    }

    case "QTY": {
      const { id, size, qty } = action.payload;
      const q = Math.max(1, Number(qty) || 1);

      return {
        ...state,
        cart: state.cart.map((x) =>
          x.id === id && normSize(x.size) === normSize(size) ? { ...x, qty: q } : x
        ),
      };
    }

    case "SIZE": {
      const { id, fromSize, toSize } = action.payload;
      const from = normSize(fromSize);
      const to = normSize(toSize);

      if (from === to) return state;

      const idx = state.cart.findIndex((x) => x.id === id && normSize(x.size) === from);
      if (idx < 0) return state;

      const current = state.cart[idx];

      // si ya existe el mismo producto con la talla destino, fusiona qty
      const mergeIdx = state.cart.findIndex((x, i) => i !== idx && x.id === id && normSize(x.size) === to);

      if (mergeIdx >= 0) {
        const next = [...state.cart];
        const merged = next[mergeIdx];

        next[mergeIdx] = {
          ...merged,
          qty: (merged.qty ?? 0) + (current.qty ?? 0),
          size: to,
        };

        next.splice(idx, 1);
        return { ...state, cart: next };
      }

      // si no hay merge, solo cambia talla
      const next = [...state.cart];
      next[idx] = { ...current, size: to };
      return { ...state, cart: next };
    }

    case "CLEAR":
      return { ...state, cart: [] };

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  }, [state.cart]);

  const actions = useMemo(() => {
    // ✅ ahora recibe size (viene de Product.jsx: addToCart({ ...p, size }))
    const addToCart = (p) =>
      dispatch({
        type: "ADD",
        payload: {
          id: p.id,
          title: p.title,
          price: p.price,
          image: p.image,
          size: normSize(p.size),
        },
      });

    // ✅ remover por id + size (para no borrar otras tallas del mismo producto)
    const removeFromCart = (id, size) =>
      dispatch({ type: "REMOVE", payload: { id, size: normSize(size) } });

    // ✅ qty por id + size
    const setQty = (id, size, qty) =>
      dispatch({ type: "QTY", payload: { id, size: normSize(size), qty } });

    // ✅ cambiar talla (id + fromSize → toSize), con merge si corresponde
    const setSize = (id, fromSize, toSize) =>
      dispatch({
        type: "SIZE",
        payload: { id, fromSize: normSize(fromSize), toSize: normSize(toSize) },
      });

    const clearCart = () => dispatch({ type: "CLEAR" });

    return { addToCart, removeFromCart, setQty, setSize, clearCart };
  }, []);

  const cartCount = state.cart.reduce((acc, x) => acc + (x.qty ?? 0), 0);
  const cartTotal = state.cart.reduce((acc, x) => acc + (x.price ?? 0) * (x.qty ?? 0), 0);

  const value = useMemo(
    () => ({ state, ...actions, cartCount, cartTotal }),
    [state, actions, cartCount, cartTotal]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}
import { createContext, useContext, useState } from 'react';

// Cart context: used during browse-products → create-order flow
const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // cart = { vendorId, vendorName, items: [{ productId, name, price, quantity, stock }] }
  const [cart, setCart] = useState(null);

  // Add or update an item. Enforces single-vendor rule.
  const addToCart = (vendorId, vendorName, product, quantity) => {
    setCart((prev) => {
      // If switching vendors, start fresh
      if (prev && prev.vendorId !== vendorId) {
        if (!window.confirm(`Your cart has items from another vendor. Clear it and start fresh?`)) return prev;
        prev = null;
      }
      const existing = prev?.items || [];
      const idx = existing.findIndex((i) => i.productId === product._id);
      let items;
      if (idx >= 0) {
        items = existing.map((i, j) => (j === idx ? { ...i, quantity } : i));
      } else {
        items = [...existing, { productId: product._id, name: product.name, price: product.price, stock: product.stock, quantity }];
      }
      return { vendorId, vendorName, items };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      if (!prev) return null;
      const items = prev.items.filter((i) => i.productId !== productId);
      return items.length === 0 ? null : { ...prev, items };
    });
  };

  const updateQty = (productId, quantity) => {
    setCart((prev) => {
      if (!prev) return null;
      return { ...prev, items: prev.items.map((i) => i.productId === productId ? { ...i, quantity } : i) };
    });
  };

  const clearCart = () => setCart(null);

  const totalCost = cart?.items.reduce((sum, i) => sum + i.price * i.quantity, 0) ?? 0;
  const itemCount = cart?.items.length ?? 0;

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalCost, itemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

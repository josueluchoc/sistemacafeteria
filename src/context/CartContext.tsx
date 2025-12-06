import { createContext, useContext, useEffect, useState } from 'react';
import type { CartItem, Product } from '../types';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Intentar recuperar carrito guardado del localStorage al iniciar
    const saved = localStorage.getItem('parroquia-cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar en localStorage cada vez que cambien los items
  useEffect(() => {
    localStorage.setItem('parroquia-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1, notes = '') => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Si ya existe, solo aumentamos la cantidad
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      // Si es nuevo, lo agregamos
      return [...currentItems, { ...product, quantity, notes }];
    });
    toast.success(`Agregado: ${product.name}`);
  };

  const removeFromCart = (productId: number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
    toast.info('Producto eliminado del carrito');
  };

  const clearCart = () => {
    setItems([]);
  };

  // Cálculos derivados
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe usarse dentro de un CartProvider');
  }
  return context;
};
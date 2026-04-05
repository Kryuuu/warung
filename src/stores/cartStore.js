import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('warungku_cart') || '[]'),

  // Add item to cart
  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existingIndex = items.findIndex(item => item.id === product.id);

    let newItems;
    if (existingIndex >= 0) {
      newItems = items.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newItems = [...items, {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity,
        stock: product.stock,
      }];
    }

    localStorage.setItem('warungku_cart', JSON.stringify(newItems));
    set({ items: newItems });
  },

  // Remove item from cart
  removeItem: (productId) => {
    const newItems = get().items.filter(item => item.id !== productId);
    localStorage.setItem('warungku_cart', JSON.stringify(newItems));
    set({ items: newItems });
  },

  // Update quantity
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const newItems = get().items.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    localStorage.setItem('warungku_cart', JSON.stringify(newItems));
    set({ items: newItems });
  },

  // Clear cart
  clearCart: () => {
    localStorage.removeItem('warungku_cart');
    set({ items: [] });
  },

  // Get total items count
  getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

  // Get total price
  getTotalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));

export default useCartStore;

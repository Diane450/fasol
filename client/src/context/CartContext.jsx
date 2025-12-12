// src/context/CartContext.jsx (ФИНАЛЬНАЯ ВЕРСИЯ С ВАЛИДАЦИЕЙ)
import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    }, []);

    const updateCart = (newCartItems) => {
        setCartItems(newCartItems);
        localStorage.setItem('cart', JSON.stringify(newCartItems));
    };

    const addToCart = (product) => {
        const existingItem = cartItems.find(item => item.id === product.id);
        const newQuantity = (existingItem ? existingItem.quantity : 0) + 1;

        // Проверка №1: Не даем добавить больше, чем есть на складе
        if (newQuantity > product.quantity) {
            message.warning(`Больше нельзя добавить. На складе всего ${product.quantity} шт.`);
            return;
        }

        if (existingItem) {
            const newCartItems = cartItems.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
            updateCart(newCartItems);
        } else {
            // При первом добавлении запоминаем, сколько всего было на складе
            updateCart([...cartItems, { ...product, quantity: 1, stock_quantity: product.quantity }]);
        }
        message.success(`${product.name} добавлен в корзину!`);
    };

    const removeFromCart = (productId) => {
        updateCart(cartItems.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        const itemInCart = cartItems.find(item => item.id === productId);
        if (!itemInCart) return;

        // Проверка №2: Не даем установить количество больше, чем было на складе
        if (quantity > itemInCart.stock_quantity) {
            message.warning(`Нельзя заказать больше, чем на складе (${itemInCart.stock_quantity} шт.)`);
            // Устанавливаем максимально доступное значение
            const newCartItems = cartItems.map(item =>
                item.id === productId ? { ...item, quantity: itemInCart.stock_quantity } : item
            );
            updateCart(newCartItems);
            return;
        }
        
        const newQuantity = Math.max(1, quantity); // Не даем установить меньше 1
        const newCartItems = cartItems.map(item =>
            item.id === productId ? { ...item, quantity: newQuantity } : item
        );
        updateCart(newCartItems);
    };

    const clearCart = () => {
        updateCart([]);
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
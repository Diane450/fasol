// src/context/CartContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    // При первой загрузке сайта, пытаемся загрузить корзину из localStorage
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            setCartItems(JSON.parse(storedCart));
        }
    }, []);

    // Функция для обновления и localStorage, и состояния
    const updateCart = (newCartItems) => {
        setCartItems(newCartItems);
        localStorage.setItem('cart', JSON.stringify(newCartItems));
    };

    const addToCart = (product) => {
        const existingItem = cartItems.find(item => item.id === product.id);

        if (existingItem) {
            // Если товар уже есть, увеличиваем количество
            const newCartItems = cartItems.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
            updateCart(newCartItems);
        } else {
            // Если товара нет, добавляем его с количеством 1
            updateCart([...cartItems, { ...product, quantity: 1 }]);
        }
        message.success(`${product.name} добавлен в корзину!`);
    };

    const removeFromCart = (productId) => {
        const newCartItems = cartItems.filter(item => item.id !== productId);
        updateCart(newCartItems);
    };

    const updateQuantity = (productId, quantity) => {
        const newQuantity = Math.max(1, quantity); // Количество не может быть меньше 1
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
// src/App.jsx (ФИНАЛЬНАЯ ВЕРСИЯ С РУСИФИКАЦИЕЙ)
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU'; // <-- 1. ИМПОРТИРУЕМ РУССКИЙ ЯЗЫКОВОЙ ПАКЕТ

import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminProductsPage from './pages/AdminProductsPage';
import CartPage from './pages/CartPage';
import AdminStockPage from './pages/AdminStockPage';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Твоя тема
const myTheme = {
  token: {
    colorPrimary: '#00b96b',
    colorWarning: '#f7931e',
    borderRadius: 6,
  },
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        {/* 2. ПЕРЕДАЕМ ЯЗЫКОВОЙ ПАКЕТ В CONFIGPROVIDER */}
        <ConfigProvider theme={myTheme} locale={ruRU}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                
                <Route index element={<HomePage />} />
                <Route path="cart" element={<CartPage />} />
                
                <Route element={<ProtectedRoute allowedRoles={['client']} />}>
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
                
                <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                  <Route path="admin/orders" element={<AdminOrdersPage />} />
                  <Route path="admin/products" element={<AdminProductsPage />} />
                  <Route path="admin/stock" element={<AdminStockPage />} />
                </Route>

              </Route>
            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
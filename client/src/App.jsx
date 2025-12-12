// src/App.jsx (ФИНАЛЬНАЯ ПРАВИЛЬНАЯ ВЕРСИЯ РОУТИНГА)
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import CartPage from './pages/CartPage';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

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
        <ConfigProvider theme={myTheme}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                
                {/* --- ПУБЛИЧНЫЕ СТРАНИЦЫ (доступны всем) --- */}
                <Route index element={<HomePage />} />
                <Route path="cart" element={<CartPage />} /> {/* <-- ПЕРЕНЕСЛИ КОРЗИНУ СЮДА */}
                
                {/* --- СТРАНИЦЫ ТОЛЬКО ДЛЯ КЛИЕНТА --- */}
                <Route element={<ProtectedRoute allowedRoles={['client']} />}>
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
                
                {/* --- СТРАНИЦЫ ТОЛЬКО ДЛЯ АДМИНА/МЕНЕДЖЕРА --- */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                  <Route path="admin/orders" element={<AdminOrdersPage />} />
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
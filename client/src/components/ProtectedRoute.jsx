// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user, loading } = useContext(AuthContext);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    if (!isAuthenticated) {
        // Если не залогинен, отправляем на главную
        return <Navigate to="/" replace />;
    }
    
    // Если роли заданы и роль пользователя не входит в их число
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Отправляем на главную, так как нет доступа
        return <Navigate to="/" replace />;
    }

    // Если всё хорошо, показываем страницу
    return <Outlet />;
};

export default ProtectedRoute;
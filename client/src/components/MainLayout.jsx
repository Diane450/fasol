// src/components/MainLayout.jsx (ФИНАЛЬНАЯ ВЕРСИЯ)
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Layout, Menu, Select, Button, Space, Avatar, Dropdown } from 'antd';
import { AppstoreOutlined, ShoppingCartOutlined, UserOutlined, DownOutlined } from '@ant-design/icons';
import { Outlet, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import AuthModal from './AuthModal';

const { Header, Content, Footer } = Layout;
const { Option } = Select;

const MainLayout = () => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:5000/api/stores')
            .then(response => {
                setStores(response.data);
                if (response.data.length > 0) {
                    setSelectedStore(response.data[0].id);
                }
            })
            .catch(error => console.error("Ошибка загрузки магазинов:", error));
    }, []);

    // --- СОВРЕМЕННЫЙ СИНТАКСИС ДЛЯ ГЛАВНОГО МЕНЮ ---
    const mainMenuItems = [
        {
            key: 'catalog',
            icon: <AppstoreOutlined />,
            label: <Link to="/">Каталог</Link>
        },
        // Показываем "Корзину" только гостям (когда user=null) или клиентам
        (!user || user.role === 'client') && {
            key: 'cart',
            icon: <ShoppingCartOutlined />,
            label: <Link to="/cart">Корзина</Link>
        }
    ].filter(Boolean); // Убираем false из массива, если условие не выполнено

    const userMenuItems = [
        // Показываем "Личный кабинет" ТОЛЬКО для роли 'client'
        user?.role === 'client' && {
            key: 'profile',
            label: <Link to="/profile">Личный кабинет</Link>,
        },
        // Показываем "Панель заказов" ТОЛЬКО для ролей 'admin' или 'manager'
        (user?.role === 'admin' || user?.role === 'manager') && {
            key: 'admin-orders',
            label: <Link to="/admin/orders">Панель заказов</Link>,
        },
        {
            key: 'logout',
            danger: true,
            label: 'Выйти',
            onClick: logout,
        },
    ].filter(Boolean);

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'fixed', zIndex: 1, width: '100%', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <img src="/logo.png" alt="Логотип" style={{ height: '40px', margin: '0 20px 0 0' }} />
                    <Menu theme="light" mode="horizontal" defaultSelectedKeys={['catalog']} items={mainMenuItems} style={{ borderBottom: 'none', flex: 1 }} />
                </div>
                <Space>
                    <Select value={selectedStore} style={{ width: 200 }} placeholder="Выберите магазин" onChange={setSelectedStore} loading={stores.length === 0}>
                        {stores.map(store => (<Option key={store.id} value={store.id}>{store.address}</Option>))}
                    </Select>
                    
                    {isAuthenticated ? (
                        <Dropdown menu={{ items: userMenuItems }}>
                            <Button>
                                <Space>
                                    <Avatar size="small" icon={<UserOutlined />} />
                                    {user.first_name}
                                    <DownOutlined />
                                </Space>
                            </Button>
                        </Dropdown>
                    ) : (
                        <Button icon={<UserOutlined />} onClick={() => setIsModalVisible(true)}>Войти</Button>
                    )}
                </Space>
            </Header>
            
            <Content style={{ padding: '0 50px', marginTop: 84 }}>
                <div style={{ background: '#fff', padding: 24, minHeight: 380, marginTop: 20, borderRadius: '8px' }}>
                    <Outlet context={{ selectedStore }} /> 
                </div>
            </Content>

            <Footer style={{ textAlign: 'center', background: '#f5f5f5' }}>
                Курсовой проект ©2025 Created with Ant Design
            </Footer>

            <AuthModal open={isModalVisible} onClose={() => setIsModalVisible(false)} />
        </Layout>
    );
};

export default MainLayout;
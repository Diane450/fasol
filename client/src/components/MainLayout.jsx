// src/components/MainLayout.jsx (ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ)
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
    const { isAuthenticated, user } = useContext(AuthContext); // Убрал logout, так как он используется в userMenuItems
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        // Загружаем список всех магазинов для выпадающего списка
        axios.get('http://localhost:5000/api/stores')
            .then(response => {
                setStores(response.data);
                // Если пользователь не менеджер и магазин еще не выбран, ставим первый из списка
                if (user?.role !== 'manager' && !selectedStore && response.data.length > 0) {
                    setSelectedStore(response.data[0].id);
                }
            })
            .catch(error => console.error("Ошибка загрузки магазинов:", error));

        // Если залогинился менеджер, принудительно устанавливаем его магазин
        if (user?.role === 'manager' && user.store_id) {
            setSelectedStore(user.store_id);
        }
    }, [user]); // Эффект будет срабатывать при логине/логауте

    const { logout } = useContext(AuthContext); // Получаем logout здесь для меню

    const mainMenuItems = [
        { key: 'catalog', icon: <AppstoreOutlined />, label: <Link to="/">Каталог</Link> },
        (!user || user.role === 'client') && { key: 'cart', icon: <ShoppingCartOutlined />, label: <Link to="/cart">Корзина</Link> }
    ].filter(Boolean); 

    const userMenuItems = [
        user?.role === 'client' && { key: 'profile', label: <Link to="/profile">Личный кабинет</Link> },
        (user?.role === 'admin' || user?.role === 'manager') && {
            key: 'admin-group',
            label: 'Админ-панель',
            children: [
                { key: 'admin-orders', label: <Link to="/admin/orders">Управление заказами</Link> },
                { key: 'admin-products', label: <Link to="/admin/products">Управление товарами</Link> },
                { key: 'admin-stock', label: <Link to="/admin/stock">Управление складом</Link> }
            ]
        },
        { key: 'logout', danger: true, label: 'Выйти', onClick: logout },
    ].filter(Boolean);

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'fixed', zIndex: 1, width: '100%', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Link to="/"><img src="/logo.png" alt="Логотип" style={{ height: '40px', margin: '0 20px 0 0' }} /></Link>                    
                    <Menu theme="light" mode="horizontal" defaultSelectedKeys={['catalog']} items={mainMenuItems} style={{ borderBottom: 'none', flex: 1 }} />
                </div>
                <Space>
                    <Select
                        value={selectedStore}
                        style={{ width: 200 }}
                        placeholder="Выберите магазин"
                        onChange={setSelectedStore} // <-- ИСПРАВЛЕНО
                        loading={stores.length === 0 && user?.role !== 'manager'}
                        disabled={user?.role === 'manager'}
                    >
                        {/* Если это менеджер, показываем только его магазин */}
                        {user?.role === 'manager' ? (
                            <Option key={user.store_id} value={user.store_id}>
                                {stores.find(s => s.id === user.store_id)?.address || 'Мой магазин'}
                            </Option>
                        ) : (
                            stores.map(store => (<Option key={store.id} value={store.id}>{store.address}</Option>))
                        )}
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
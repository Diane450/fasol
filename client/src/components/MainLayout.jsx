// src/components/MainLayout.jsx (ИСПРАВЛЕННАЯ ВЕРСИЯ)
import React, { useState, useEffect, useContext } from 'react'; // <--- ВОТ ИСПРАВЛЕНИЕ
import axios from 'axios';
import { Layout, Menu, Select, Button, Space, Avatar } from 'antd';
import { AppstoreOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
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

    const handleStoreChange = (value) => {
        setSelectedStore(value);
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Header style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                position: 'fixed', 
                zIndex: 1, 
                width: '100%',
                background: '#fff',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo.png" alt="Логотип" style={{ height: '40px', margin: '0 20px 0 0' }} />
                    <Menu 
                        theme="light"
                        mode="horizontal" 
                        defaultSelectedKeys={['1']}
                        style={{ borderBottom: 'none' }}
                    >
                        <Menu.Item key="1" icon={<AppstoreOutlined />}><Link to="/">Каталог</Link></Menu.Item>
                        <Menu.Item key="2" icon={<ShoppingCartOutlined />}><Link to="/cart">Корзина</Link></Menu.Item>
                    </Menu>
                </div>
                <Space>
                    <Select
                        value={selectedStore}
                        style={{ width: 200 }}
                        placeholder="Выберите магазин"
                        onChange={handleStoreChange}
                        loading={stores.length === 0}
                    >
                        {stores.map(store => (
                            <Option key={store.id} value={store.id}>{store.address}</Option>
                        ))}
                    </Select>
                    {isAuthenticated ? (
                        <>
                            <Avatar icon={<UserOutlined />} />
                            <span style={{ color: '#000' }}>{user.first_name}</span>
                            <Button onClick={logout}>Выйти</Button>
                        </>
                    ) : (
                        <Button icon={<UserOutlined />} onClick={() => setIsModalVisible(true)}>
                            Войти
                        </Button>
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

            <AuthModal
                open={isModalVisible} // <-- меняем visible на open
                onClose={() => setIsModalVisible(false)}
            />
        </Layout>
    );
};

export default MainLayout;
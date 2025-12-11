// src/components/MainLayout.jsx (Обновленная версия)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layout, Menu, Select, Button, Space } from 'antd';
import { AppstoreOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons';
import { Outlet, Link } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Option } = Select;

const MainLayout = () => {
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);

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
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}> {/* Сделаем фон сайта чуть-чуть серым для контраста */}
            {/* 1. СОВРЕМЕННЫЙ ХЕДЕР */}
            <Header style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                position: 'fixed', 
                zIndex: 1, 
                width: '100%',
                background: '#fff', // Белый фон
                borderBottom: '1px solid #f0f0f0' // Тонкая линия внизу
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo.png" alt="Логотип" style={{ height: '40px', margin: '0 20px 0 0' }} />
                    <Menu 
                        theme="light" // Светлая тема для меню!
                        mode="horizontal" 
                        defaultSelectedKeys={['1']}
                        style={{ borderBottom: 'none' }} // Убираем свою линию у меню
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
                    <Button icon={<UserOutlined />}>Войти</Button>
                </Space>
            </Header>
            
            <Content style={{ padding: '0 50px', marginTop: 84 }}>
                <div style={{ background: '#fff', padding: 24, minHeight: 380, marginTop: 20, borderRadius: '8px' }}> {/* Скруглим углы у контента */}
                    <Outlet context={{ selectedStore }} /> 
                </div>
            </Content>

            <Footer style={{ textAlign: 'center', background: '#f5f5f5' }}>
                Курсовой проект ©2025 Created with Ant Design
            </Footer>
        </Layout>
    );
};

export default MainLayout;
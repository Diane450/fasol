// src/pages/HomePage.jsx (ПОЛНАЯ ВЕРСИЯ С ИКОНКАМИ БЕЗ ИЗМЕНЕНИЯ БД)
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { Spin, Typography, Empty, Row, Col, Select, Radio, Divider, Space } from 'antd';
import ProductCard from '../components/ProductCard';
import AuthContext from '../context/AuthContext';

const { Option } = Select;

// --- СЛОВАРЬ ИКОНОК ---
// Ключ - это ID категории из твоей базы данных.
// Значение - это путь к иконке в папке `public`.
// ОБЯЗАТЕЛЬНО проверь ID и пути к файлам!
const categoryIcons = {
  1: '/icons/milk-carton.png',   // Для ID=1 (Молочные продукты)
  2: '/icons/vegetable.png',  // Для ID=2 (Овощи и фрукты)
  3: '/icons/breads.png',   // Для ID=3 (Хлеб)
  4: '/icons/meat.png',    // Для ID=4 (Мясо)
};

const sortIcons = {
    'price-asc': '/sorting/sort-price-asc.png',
    'price-desc': '/sorting/sort-price-desc.png',
    'name-asc': '/sorting/sort-name-asc.png',
    'name-desc': '/sorting/sort-name-desc.png',
};

const HomePage = () => {
    const { selectedStore } = useOutletContext();
    const { user } = useContext(AuthContext);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category_id: 'all',
        sortOrder: 'price-asc',
    });

    // Загрузка категорий
    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL}/api/categories`)
            .then(response => setCategories(response.data))
            .catch(error => console.error("Ошибка загрузки категорий:", error));
    }, []);

    // Загрузка товаров
    useEffect(() => {
        if (!selectedStore) return;

        setLoading(true);
        const params = new URLSearchParams();
        params.append('store_id', selectedStore);

        if (filters.category_id !== 'all') {
            params.append('category_id', filters.category_id);
        }

        const [sortBy, order] = filters.sortOrder.split('-');
        params.append('sortBy', sortBy);
        params.append('order', order);
        
        axios.get(`${import.meta.env.VITE_API_URL}/api/products?${params.toString()}`)
            .then(response => {
                setProducts(response.data);
            })
            .catch(error => console.error("Ошибка загрузки товаров:", error))
            .finally(() => {
                setLoading(false);
            });
    }, [selectedStore, filters]);

    // Показываем главный спиннер только при самой первой загрузке
    if (loading && products.length === 0 && categories.length === 0) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    return (
        <div>
            <Typography.Title level={2} style={{ marginBottom: 24 }}>Каталог товаров</Typography.Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="middle">
                <Col xs={24} md={18}>
                    <Radio.Group 
                        value={filters.category_id} 
                        onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
                    >
                        <Radio.Button value="all">Все категории</Radio.Button>
                        {categories.map(cat => (
                            <Radio.Button key={cat.id} value={cat.id}>
                                <Space>
                                    {categoryIcons[cat.id] && (
                                        <img 
                                            src={categoryIcons[cat.id]} 
                                            alt={cat.name} 
                                            style={{ height: '20px', width: '20px', objectFit: 'contain' }} 
                                        />
                                    )}
                                    <span>{cat.name}</span>
                                </Space>
                            </Radio.Button>
                        ))}
                    </Radio.Group>
                </Col>
                <Col xs={24} md={6}>
                    <Select 
                        value={filters.sortOrder} 
                        style={{ width: '100%' }}
                        onChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value }))}
                    >
                        <Option value="price-asc">
                            <Space align="center">
                                <img src={sortIcons['price-asc']} alt="Дешевые" style={{ height: '16px' }} />
                                Сначала дешевые
                            </Space>
                        </Option>
                        <Option value="price-desc">
                            <Space align="center">
                                <img src={sortIcons['price-desc']} alt="Дорогие" style={{ height: '16px' }} />
                                Сначала дорогие
                            </Space>
                        </Option>
                        <Option value="name-asc">
                            <Space align="center">
                                <img src={sortIcons['name-asc']} alt="А-Я" style={{ height: '16px' }} />
                                По названию (А-Я)
                            </Space>
                        </Option>
                        <Option value="name-desc">
                            <Space align="center">
                                <img src={sortIcons['name-desc']} alt="Я-А" style={{ height: '16px' }} />
                                По названию (Я-А)
                            </Space>
                        </Option>
                    </Select>
                </Col>
            </Row>

            <Divider />

            {loading ? <div style={{ textAlign: 'center', padding: 50 }}><Spin /></div> : (
                products.length > 0 ? (
                    <Row gutter={[16, 24]}>
                        {products.map(product => (
                            <Col key={product.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                                <ProductCard product={product} userRole={user?.role} />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Empty description="Товары не найдены. Попробуйте изменить фильтры." />
                )
            )}
        </div>
    );
};

export default HomePage;
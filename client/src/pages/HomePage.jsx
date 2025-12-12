// src/pages/HomePage.jsx (ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ)
import React, { useState, useEffect, useContext } from 'react'; // <-- ДОБАВИЛИ useContext
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { Spin, Typography, Empty, Row, Col, Select, Radio, Divider } from 'antd';
import ProductCard from '../components/ProductCard';
import AuthContext from '../context/AuthContext'; // <-- ДОБАВИЛИ ИМПОРТ КОНТЕКСТА

const { Option } = Select;

const HomePage = () => {
    const { selectedStore } = useOutletContext();
    const { user } = useContext(AuthContext);
    // Состояния для данных
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Состояния для фильтров
    const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' - для "Все категории"
    const [sortOrder, setSortOrder] = useState('price-asc'); // Значение по умолчанию

    // 1. Загружаем категории один раз при старте
    useEffect(() => {
        axios.get('http://localhost:5000/api/categories')
            .then(response => {
                setCategories(response.data);
            })
            .catch(error => console.error("Ошибка загрузки категорий:", error));
    }, []);

    // 2. Загружаем товары каждый раз, когда меняется магазин, категория или сортировка
    useEffect(() => {
        if (!selectedStore) return;

        setLoading(true);

        // Собираем параметры для запроса
        const params = new URLSearchParams();
        params.append('store_id', selectedStore);

        if (selectedCategory !== 'all') {
            params.append('category_id', selectedCategory);
        }

        // Разбираем sortOrder на sortBy и order
        const [sortBy, order] = sortOrder.split('-');
        params.append('sortBy', sortBy);
        params.append('order', order);
        
        axios.get(`http://localhost:5000/api/products?${params.toString()}`)
            .then(response => {
                setProducts(response.data);
            })
            .catch(error => console.error("Ошибка загрузки товаров:", error))
            .finally(() => {
                setLoading(false);
            });
    }, [selectedStore, selectedCategory, sortOrder]); // <-- Зависимости эффекта

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    return (
        <div>
            <Typography.Title level={2} style={{ marginBottom: 24 }}>Каталог товаров</Typography.Title>

            {/* Панель фильтров и сортировки */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={16}>
                    <Radio.Group 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <Radio.Button value="all">Все категории</Radio.Button>
                        {categories.map(cat => (
                            <Radio.Button key={cat.id} value={cat.id}>{cat.name}</Radio.Button>
                        ))}
                    </Radio.Group>
                </Col>
                <Col xs={24} sm={8}>
                    <Select 
                        value={sortOrder} 
                        style={{ width: '100%' }}
                        onChange={(value) => setSortOrder(value)}
                    >
                        <Option value="price-asc">Сначала дешевые</Option>
                        <Option value="price-desc">Сначала дорогие</Option>
                        <Option value="name-asc">По названию (А-Я)</Option>
                        <Option value="name-desc">По названию (Я-А)</Option>
                    </Select>
                </Col>
            </Row>

            <Divider />

            {products.length > 0 ? (
                <Row gutter={[16, 16]}>
                    {products.map(product => (
                        <Col key={product.id} xs={24} sm={12} md={8} lg={6} xl={4}>
                            {/* Передаем роль в карточку */}
                            <ProductCard product={product} userRole={user?.role} />
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty description="Товары не найдены. Попробуйте изменить фильтры." />
            )}
        </div>
    );
};

export default HomePage;
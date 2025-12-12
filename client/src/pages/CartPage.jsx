// src/pages/CartPage.jsx (ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ)
import React, { useContext } from 'react';
import { Typography, List, Button, Avatar, InputNumber, Row, Col, Statistic, Card, Empty, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';

const { Title, Text } = Typography;

const blobToBase64 = (blobData) => {
    if (!blobData || !blobData.data) return null;
    const CHUNK_SIZE = 0x8000;
    const bytes = blobData.data;
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode.apply(null, bytes.slice(i, i + CHUNK_SIZE));
    }
    try {
        return `data:image/jpeg;base64,${btoa(binary)}`;
    } catch (e) { return null; }
};

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
    const { isAuthenticated } = useContext(AuthContext);
    const { selectedStore } = useOutletContext();
    const navigate = useNavigate();

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Функция handleCheckout находится прямо внутри компонента, где и должна быть
    const handleCheckout = async () => {
        if (!isAuthenticated) {
            message.warning('Пожалуйста, войдите в систему, чтобы оформить заказ.');
            return;
        }
        if (!selectedStore) {
            message.error('Магазин не выбран. Пожалуйста, вернитесь в каталог и выберите магазин.');
            return;
        }
        try {
            // Мы больше не передаем total_price, так как сервер считает его сам
            const orderData = {
                store_id: selectedStore,
                items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                })),
            };
            await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, orderData);
            message.success('Ваш заказ успешно оформлен!');
            clearCart();
            navigate('/profile');
        } catch (error) {
            message.error(error.response?.data?.message || 'Не удалось оформить заказ.');
        }
    };

    if (cartItems.length === 0) {
        return (
            <div>
                <Title level={2}>Ваша корзина</Title>
                <Empty description="Ваша корзина пуста">
                    <Button type="primary"><Link to="/">Начать покупки</Link></Button>
                </Empty>
            </div>
        );
    }

    return (
        <div>
            <Title level={2} style={{ marginBottom: 24 }}>Ваша корзина</Title>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <List
                        itemLayout="horizontal"
                        dataSource={cartItems}
                        renderItem={(item) => (
                            <List.Item
                                actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(item.id)} />]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar src={blobToBase64(item.image) || '/placeholder.png'} />}
                                    title={<Link to={`/product/${item.id}`}>{item.name}</Link>}
                                    description={`${item.price} ₽ / шт.`}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <InputNumber
                                        min={1}
                                        max={item.stock_quantity}
                                        value={item.quantity}
                                        onChange={(value) => updateQuantity(item.id, value)}
                                    />
                                    <Text strong>{(item.price * item.quantity).toFixed(2)} ₽</Text>
                                </div>
                            </List.Item>
                        )}
                    />
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Итоги заказа" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                        <Statistic title="Общая стоимость" value={totalPrice} precision={2} suffix="₽" />
                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{ marginTop: 24 }}
                            onClick={handleCheckout}
                            disabled={cartItems.length === 0}
                        >
                            Оформить заказ
                        </Button>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default CartPage;
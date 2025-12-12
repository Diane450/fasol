// src/pages/CartPage.jsx (ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ)
import React, { useContext } from 'react';
import { Typography, List, Button, Avatar, InputNumber, Row, Col, Statistic, Card, Empty, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';

const { Title, Text } = Typography;

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, clearCart } = useContext(CartContext);
    const { isAuthenticated, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Считаем общую стоимость
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            message.warning('Пожалуйста, войдите в систему, чтобы оформить заказ.');
            // В идеале - открыть модалку входа, но для простоты пока так.
            return;
        }

        try {
            // Формируем данные для отправки на сервер
            const orderData = {
                store_id: 1, // ЗАГЛУШКА: нужно брать выбранный магазин
                items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price_at_purchase: item.price
                })),
                total_price: totalPrice
            };

            await axios.post('http://localhost:5000/api/orders', orderData);
            
            message.success('Ваш заказ успешно оформлен! Менеджер скоро с вами свяжется.');
            clearCart(); // Очищаем корзину после успешного заказа
            navigate('/profile'); // Перенаправляем в личный кабинет на страницу заказов
        } catch (error) {
            console.error("Ошибка оформления заказа:", error);
            message.error('Не удалось оформить заказ. Попробуйте позже.');
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
                {/* Список товаров в корзине */}
                <Col xs={24} lg={16}>
                    <List
                        itemLayout="horizontal"
                        dataSource={cartItems}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeFromCart(item.id)}
                                    />
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar src={item.image_url} />}
                                    title={<Link to={`/product/${item.id}`}>{item.name}</Link>}
                                    description={`${item.price} ₽ / шт.`}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <InputNumber
                                        min={1}
                                        value={item.quantity}
                                        onChange={(value) => updateQuantity(item.id, value)}
                                    />
                                    <Text strong>{(item.price * item.quantity).toFixed(2)} ₽</Text>
                                </div>
                            </List.Item>
                        )}
                    />
                </Col>

                {/* Итоги заказа */}
                <Col xs={24} lg={8}>
                    <Card title="Итоги заказа">
                        <Statistic title="Общая стоимость" value={totalPrice} precision={2} suffix="₽" />
                        <Button
                            type="primary"
                            size="large"
                            block
                            style={{ marginTop: 24 }}
                            onClick={handleCheckout}
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
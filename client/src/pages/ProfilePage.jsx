// src/pages/ProfilePage.jsx (ФИНАЛЬНАЯ ВЕРСИЯ С БОКОВЫМИ ВКЛАДКАМИ)
import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message, Spin, Typography, Descriptions, Divider, Table, Tag, Col, Row, Tabs } from 'antd';
import axios from 'axios';

const ProfilePage = () => {
    const [form] = Form.useForm();
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

// src/pages/ProfilePage.jsx (обновленная fetchData)
const fetchData = async () => {
    setLoading(true);
    try {
        const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`);
        const ordersRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders/my`);

        // Для каждого заказа сразу загружаем его детали
        const ordersWithDetails = await Promise.all(
            ordersRes.data.map(order => 
                axios.get(`${import.meta.env.VITE_API_URL}/api/orders/${order.id}`).then(res => res.data)
            )
        );
        
        setProfile(profileRes.data || null);
        setOrders(ordersWithDetails || []); // Сохраняем заказы уже с деталями
        
        if (profileRes.data) {
            form.setFieldsValue(profileRes.data);
        }
    } catch (error) { /* ... */ } 
    finally { setLoading(false); }
};

    useEffect(() => {
        fetchData();
    }, []);

    const onFinishUpdateProfile = async (values) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/profile`, values);
            message.success('Профиль успешно обновлен!');
            fetchData();
        } catch (error) {
            message.error('Ошибка обновления профиля');
        }
    };

const expandedRowRender = (record) => {
        const columns = [
            { title: 'Товар', dataIndex: 'product_name', key: 'product_name' },
            { title: 'Количество', dataIndex: 'quantity', key: 'quantity', render: (text) => `${text} шт.` },
            { title: 'Цена за шт.', dataIndex: 'price_at_purchase', key: 'price', render: (text) => `${text} ₽` },
            { title: 'Сумма', key: 'total', render: (_, item) => `${(item.quantity * item.price_at_purchase).toFixed(2)} ₽`},
        ];

        // Запрашиваем детали заказа при раскрытии
        // Для простоты можно и сразу грузить, но так эффективнее
        if (!record.items) {
            // Можно добавить логику загрузки по клику, если заказов очень много
            return <Spin />;
        }

        return <Table columns={columns} dataSource={record.items} pagination={false} rowKey="product_name" />;
    };

    const orderColumns = [
        { title: '№ Заказа', dataIndex: 'id', key: 'id' },
        { title: 'Дата', dataIndex: 'created_at', key: 'date', render: (text) => new Date(text).toLocaleDateString() },
        { title: 'Сумма', dataIndex: 'total_price', key: 'price', render: (text) => `${text} ₽` },
        { title: 'Статус', dataIndex: 'status', key: 'status', render: (text, record) => <Tag color={record.status_color || 'blue'}>{text}</Tag> },
    ];

    // --- СОДЕРЖИМОЕ ВКЛАДОК ---

    // Вкладка 1: Профиль и редактирование
    const profileTabContent = (
        <div>
            <Descriptions title="Ваши данные" bordered column={1} style={{ marginBottom: 32 }}>
                <Descriptions.Item label="Имя">{profile?.first_name} {profile?.last_name}</Descriptions.Item>
                <Descriptions.Item label="Email">{profile?.email}</Descriptions.Item>
                <Descriptions.Item label="Телефон">{profile?.phone}</Descriptions.Item>
                <Descriptions.Item label="Адрес доставки">{profile?.delivery_address || 'Не указан'}</Descriptions.Item>
            </Descriptions>

            <Typography.Title level={4}>Редактировать профиль</Typography.Title>
            <Form form={form} layout="vertical" onFinish={onFinishUpdateProfile}>
                <Row gutter={16}>
                    <Col xs={24} sm={12}><Form.Item name="first_name" label="Имя"><Input /></Form.Item></Col>
                    <Col xs={24} sm={12}><Form.Item name="last_name" label="Фамилия"><Input /></Form.Item></Col>
                    <Col xs={24} sm={12}><Form.Item name="phone" label="Телефон"><Input /></Form.Item></Col>
                    <Col span={24}><Form.Item name="delivery_address" label="Адрес доставки"><Input.TextArea rows={2} /></Form.Item></Col>
                </Row>
                <Form.Item>
                    <Button type="primary" htmlType="submit">Сохранить изменения</Button>
                </Form.Item>
            </Form>
        </div>
    );

    // Вкладка 2: История заказов
const ordersTabContent = (
        <div>
            <Typography.Title level={4}>История ваших заказов</Typography.Title>
            <Table 
                columns={orderColumns} 
                dataSource={orders} 
                rowKey="id"
                expandable={{ expandedRowRender }} // <-- Включаем раскрытие
            />
        </div>
    );

    // Описываем наши вкладки
    const tabItems = [
        {
            label: 'Личные данные',
            key: '1',
            children: profileTabContent,
        },
        {
            label: 'История заказов',
            key: '2',
            children: ordersTabContent,
        },
    ];

    if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    if (!profile) return <Typography.Title level={3}>Не удалось загрузить данные профиля. Пожалуйста, попробуйте войти в систему еще раз.</Typography.Title>;

    return (
        <div>
            <Typography.Title level={2} style={{ marginBottom: 24 }}>Личный кабинет</Typography.Title>
            <Tabs 
                defaultActiveKey="1" 
                tabPosition="left" // <-- Магия здесь!
                items={tabItems}
            />
        </div>
    );
};

export default ProfilePage;
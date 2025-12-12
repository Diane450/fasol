// src/pages/AdminOrdersPage.jsx (ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ)
import React, { useState, useEffect } from 'react';
import { Table, Select, message, Spin, Typography, Tag } from 'antd';
import axios from 'axios';

const { Option } = Select;

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, statusesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/orders`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/order-statuses`)
            ]);
            
            // Для каждого заказа из списка запрашиваем его детали
            const ordersWithDetails = await Promise.all(
                ordersRes.data.map(order => 
                    axios.get(`${import.meta.env.VITE_API_URL}/api/orders/${order.id}`).then(res => res.data)
                )
            );
            
            // --- ИСПРАВЛЕНИЕ ---
            // Сохраняем в состояние именно массив с деталями
            setOrders(ordersWithDetails || []); 
            setStatuses(statusesRes.data || []);

        } catch (error) {
            message.error('Не удалось загрузить данные о заказах');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusChange = async (orderId, newStatusId) => {
        try {
            await axios.patch(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`, { statusId: newStatusId });
            message.success('Статус заказа успешно обновлен!');
            
            // Обновляем статус локально для мгновенного отклика интерфейса
            setOrders(prevOrders => prevOrders.map(order => 
                order.id === orderId 
                ? { ...order, status_id: newStatusId, status: statuses.find(s => s.id === newStatusId)?.label } 
                : order
            ));
        } catch (error) {
            message.error('Ошибка при обновлении статуса');
            console.error(error);
        }
    };

    const expandedRowRender = (record) => {
        const columns = [
            { title: 'Товар', dataIndex: 'product_name', key: 'product_name' },
            { title: 'Количество', dataIndex: 'quantity', key: 'quantity', render: text => `${text} шт.` },
            { title: 'Цена за шт.', dataIndex: 'price_at_purchase', key: 'price', render: text => `${text} ₽` },
            { title: 'Сумма', key: 'total', render: (_, item) => `${(item.quantity * item.price_at_purchase).toFixed(2)} ₽`},
        ];
        // Проверяем, есть ли вообще items, на всякий случай
        return <Table columns={columns} dataSource={record.items || []} pagination={false} rowKey="product_name" />;
    };

    const columns = [
        { title: '№ Заказа', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id },
        { 
            title: 'Клиент', 
            dataIndex: 'first_name', 
            key: 'client',
            render: (text, record) => `${record.first_name} ${record.last_name}`
        },
        { 
            title: 'Дата', 
            dataIndex: 'created_at', 
            key: 'date', 
            render: (text) => new Date(text).toLocaleString(),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at)
        },
        { 
            title: 'Сумма', 
            dataIndex: 'total_price', 
            key: 'price', 
            render: (text) => `${text} ₽`,
            sorter: (a, b) => a.total_price - b.total_price
        },
        { 
            title: 'Статус', 
            dataIndex: 'status', 
            key: 'status',
            render: (text, record) => <Tag color={record.status_color || 'default'}>{text}</Tag>
        },
        {
            title: 'Изменить статус',
            key: 'action',
            render: (text, record) => (
                <Select
                    defaultValue={record.status_id}
                    style={{ width: 180 }}
                    onChange={(value) => handleStatusChange(record.id, value)}
                >
                    {statuses.map(status => (
                        <Option key={status.id} value={status.id}>
                            {status.label}
                        </Option>
                    ))}
                </Select>
            ),
        },
    ];

    if (loading) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    return (
        <div>
            <Typography.Title level={2}>Управление заказами</Typography.Title>
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                bordered
                expandable={{ expandedRowRender }}
            />
        </div>
    );
};

export default AdminOrdersPage;
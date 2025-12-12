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
            // ИСПРАВЛЕНО: Добавлены полные URL к серверу
            const [ordersRes, statusesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/orders'),
                axios.get('http://localhost:5000/api/order-statuses')
            ]);
            
            setOrders(ordersRes.data || []);
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
            // ИСПРАВЛЕНО: Добавлен полный URL к серверу
            await axios.patch(`http://localhost:5000/api/orders/${orderId}/status`, { statusId: newStatusId });
            message.success('Статус заказа успешно обновлен!');
            // Просто обновляем данные в состоянии, чтобы не перезагружать всё с сервера
            setOrders(prevOrders => prevOrders.map(order => 
                order.id === orderId ? { ...order, status_id: newStatusId, status: statuses.find(s => s.id === newStatusId)?.label } : order
            ));
        } catch (error) {
            message.error('Ошибка при обновлении статуса');
            console.error(error);
        }
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
            title: 'Текущий статус', 
            dataIndex: 'status', 
            key: 'status',
            render: (text) => <Tag color="blue">{text}</Tag> // Упростил для надежности
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
            />
        </div>
    );
};

export default AdminOrdersPage;
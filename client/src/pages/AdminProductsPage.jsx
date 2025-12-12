import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Modal, Form, InputNumber, Select, Upload, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import debounce from 'lodash/debounce';

const { Option } = Select;

const AdminProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form] = Form.useForm();

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const productsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/products`, { params });
            setProducts(productsRes.data);
        } catch (error) {
            message.error('Не удалось загрузить товары');
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const fetchDirectories = async () => {
            try {
                const [categoriesRes, storesRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/categories`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/stores`),
                ]);
                setCategories(categoriesRes.data);
                setStores(storesRes.data);
            } catch (error) {
                message.error('Не удалось загрузить справочники');
            }
        };
        fetchData();
        fetchDirectories();
    }, []);

    const debouncedFetchData = useCallback(debounce(fetchData, 300), []);

    const handleSearchChange = (e) => {
        const { value } = e.target;
        debouncedFetchData({ search: value });
    };

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingProduct(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/products/${id}`);
            message.success('Товар успешно удален');
            fetchData();
        } catch (error) {
            message.error('Ошибка при удалении товара');
        }
    };

    const handleOk = () => {
        form.validateFields().then(async (values) => {
            const formData = new FormData();
            Object.keys(values).forEach(key => {
                if (key === 'image') {
                    if (values.image && values.image[0]) {
                        formData.append('image', values.image[0].originFileObj);
                    }
                } else if (values[key] !== undefined) {
                    formData.append(key, values[key]);
                }
            });

            try {
                if (editingProduct) {
                    await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/products/${editingProduct.id}`, formData);
                    message.success('Товар успешно обновлен');
                } else {
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/products`, formData);
                    message.success('Товар успешно создан');
                }
                setIsModalVisible(false);
                fetchData();
            } catch (error) {
                message.error('Ошибка при сохранении товара');
            }
        });
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', sorter: (a, b) => a.id - b.id },
        { title: 'Название', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Цена', dataIndex: 'price', sorter: (a, b) => a.price - b.price, render: (text) => `${text} ₽` },
        { title: 'Категория', dataIndex: 'category_name' },
        {
            title: 'Действия',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Popconfirm title="Удалить этот товар?" onConfirm={() => handleDelete(record.id)}>
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Input 
                    placeholder="Поиск по названию..." 
                    onChange={handleSearchChange}
                    style={{ width: 300 }}
                    allowClear
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Добавить товар</Button>
            </div>
            <Table columns={columns} dataSource={products} loading={loading} rowKey="id" />

            <Modal
                title={editingProduct ? 'Редактировать товар' : 'Добавить товар'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical" initialValues={{ quantity: 10, store_id: 1 }}>
                    <Form.Item name="name" label="Название" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Описание"><Input.TextArea /></Form.Item>
                    <Form.Item name="price" label="Цена" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="category_id" label="Категория" rules={[{ required: true }]}>
                        <Select placeholder="Выберите категорию">{categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}</Select>
                    </Form.Item>
                    {!editingProduct && (
                        <>
                            <Form.Item name="store_id" label="Магазин" rules={[{ required: true }]}>
                                <Select placeholder="Выберите магазин">{stores.map(store => <Option key={store.id} value={store.id}>{store.name}</Option>)}</Select>
                            </Form.Item>
                             <Form.Item name="quantity" label="Количество на складе" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                        </>
                    )}
                    <Form.Item name="image" label="Изображение" valuePropName="fileList" getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}>
                        <Upload listType="picture" beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Загрузить</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminProductsPage;
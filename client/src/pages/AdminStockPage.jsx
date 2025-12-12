// src/pages/AdminStockPage.jsx (ПОЛНЫЙ КОД)
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, InputNumber, Form, Typography, message, Popconfirm } from 'antd';
import axios from 'axios';
import debounce from 'lodash/debounce';

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Введите ${title}!` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const AdminStockPage = () => {
    const [form] = Form.useForm();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState('');

    const isEditing = (record) => record.id === editingKey;

    const fetchData = async (params = {}) => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/stock', { params });
            setData(response.data);
        } catch (error) {
            message.error('Не удалось загрузить данные склада');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const debouncedFetchData = useCallback(debounce(fetchData, 400), []);

    const handleSearchChange = (e) => {
        debouncedFetchData({ search: e.target.value });
    };

    const edit = (record) => {
        form.setFieldsValue({ quantity: '', ...record });
        setEditingKey(record.id);
    };

    const cancel = () => {
        setEditingKey('');
    };

    const save = async (id) => {
        try {
            const row = await form.validateFields();
            await axios.put(`http://localhost:5000/api/admin/stock/${id}`, { quantity: row.quantity });
            
            const newData = [...data];
            const index = newData.findIndex((item) => id === item.id);
            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, { ...item, ...row });
                setData(newData);
                setEditingKey('');
                message.success('Количество обновлено');
            }
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
            message.error('Ошибка сохранения');
        }
    };

    const columns = [
        { title: 'Товар', dataIndex: 'product_name', sorter: (a, b) => a.product_name.localeCompare(b.product_name) },
        { title: 'Магазин', dataIndex: 'store_name', sorter: (a, b) => a.store_name.localeCompare(b.store_name) },
        { title: 'Количество', dataIndex: 'quantity', width: '25%', editable: true, sorter: (a, b) => a.quantity - b.quantity },
        {
            title: 'Действие',
            dataIndex: 'action',
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <span>
                        <Typography.Link onClick={() => save(record.id)} style={{ marginRight: 8 }}>
                            Сохранить
                        </Typography.Link>
                        <Popconfirm title="Отменить изменения?" onConfirm={cancel}>
                            <a>Отмена</a>
                        </Popconfirm>
                    </span>
                ) : (
                    <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
                        Изменить
                    </Typography.Link>
                );
            },
        },
    ];

    const mergedColumns = columns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: 'number',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });

    return (
        <div>
            <Typography.Title level={2}>Управление складом</Typography.Title>
            <Input 
                placeholder="Поиск по товару или магазину..." 
                onChange={handleSearchChange}
                style={{ width: 300, marginBottom: 16 }}
                allowClear
            />
            <Form form={form} component={false}>
                <Table
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    bordered
                    dataSource={data}
                    columns={mergedColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ onChange: cancel }}
                />
            </Form>
        </div>
    );
};

export default AdminStockPage;
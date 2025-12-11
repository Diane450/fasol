// src/components/ProductCard.jsx
import React from 'react';
import { Card, Button, Typography, Tag } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Meta } = Card;
const { Text } = Typography;

const ProductCard = ({ product }) => {
    return (
        <Card
            hoverable
            cover={<img alt={product.name} src={product.image_url || 'https://via.placeholder.com/300'} style={{ height: 200, objectFit: 'cover' }} />}
            actions={[
                <Button type="primary" icon={<ShoppingCartOutlined />}>
                    В корзину
                </Button>
            ]}
        >
            <Meta
                title={product.name}
                description={<Tag color="blue">{product.category_name || 'Без категории'}</Tag>}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ fontSize: '1.2em' }}>{product.price} ₽</Text>
                <Text type="secondary">В наличии: {product.quantity} шт.</Text>
            </div>
        </Card>
    );
};

export default ProductCard;
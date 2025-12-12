// src/components/ProductCard.jsx (ВЕРСИЯ С ПОДДЕРЖКОЙ BLOB И ПОДСКАЗКОЙ)
import React, { useContext } from 'react';
import { Card, Button, Typography, Tag, Tooltip } from 'antd'; // <-- Добавили Tooltip
import { ShoppingCartOutlined } from '@ant-design/icons';
import CartContext from '../context/CartContext';

const { Meta } = Card;
const { Text } = Typography;

// Функция-помощник для конвертации BLOB в Base64
const blobToBase64 = (blobData) => {
    if (!blobData || !blobData.data) {
        return 'https://via.placeholder.com/300'; // Заглушка, если данных нет
    }
    // `blobData.data` - это массив байтов. Превращаем его в строку.
    const binaryString = String.fromCharCode.apply(null, blobData.data);
    // Кодируем строку в base64
    const base64String = btoa(binaryString);
    // Возвращаем готовый URL для тега <img>
    return `data:image/jpeg;base64,${base64String}`;
};


const ProductCard = ({ product, userRole }) => {
    const { addToCart } = useContext(CartContext);

    const actions = [
        (!userRole || userRole === 'client') && (
            <Button
                type="primary"
                icon={<ShoppingCartOutlined />}
                onClick={() => addToCart(product)}
            >
                В корзину
            </Button>
        )
    ].filter(Boolean);

    // Конвертируем картинку для отображения
    const imageUrl = blobToBase64(product.image);

    return (
        <Card
            hoverable
            cover={<img alt={product.name} src={imageUrl} style={{ height: 200, objectFit: 'cover' }} />}
            actions={actions}
        >
            <Meta
                // Оборачиваем заголовок в Tooltip для подсказки
                title={
                    <Tooltip title={product.name}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.name}
                        </div>
                    </Tooltip>
                }
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
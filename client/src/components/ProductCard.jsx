import React, { useContext } from 'react';
import { Card, Button, Typography, Tag, Tooltip } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import CartContext from '../context/CartContext';

const { Meta } = Card;
const { Text } = Typography;

const blobToBase64 = (blobData) => {
    if (!blobData || !blobData.data) {
        return null; // Возвращаем null, чтобы сработала заглушка
    }
    const binaryString = String.fromCharCode.apply(null, blobData.data);
    const base64String = btoa(binaryString);
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

    // --- ЛОГИКА ОТОБРАЖЕНИЯ КАРТИНКИ С ЗАГЛУШКОЙ ---
    // Сначала пытаемся получить картинку из BLOB
    let imageUrl = blobToBase64(product.image);
    // Если из BLOB ничего не пришло (null), используем нашу заглушку из папки public
    if (!imageUrl) {
        imageUrl = '/no-pictures.png'; // Убедись, что файл с таким именем есть в client/public
    }

    return (
        <Card
            hoverable
            cover={<img alt={product.name} src={imageUrl} style={{ height: 200, objectFit: 'cover' }} />}
            actions={actions}
        >
            <Meta
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
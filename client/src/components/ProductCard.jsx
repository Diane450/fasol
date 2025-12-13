import React, { useContext } from 'react';
import { Card, Button, Typography, Tag, Tooltip } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import CartContext from '../context/CartContext';

const { Meta } = Card;
const { Text } = Typography;

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
    } catch (e) {
        return null;
    }
};

const ProductCard = ({ product, userRole }) => {
    const { addToCart } = useContext(CartContext);

    const imageUrl = blobToBase64(product.image) || '/placeholder.png';

    return (
        <Card
            hoverable
            style={{ borderRadius: '12px', overflow: 'hidden' }}
            bodyStyle={{ padding: '16px' }}
            cover={
                <div style={{ 
                    height: 180, 
                    backgroundColor: '#f5f5f5', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img 
                        alt={product.name} 
                        src={imageUrl} 
                        style={{ 
                            maxHeight: '100%',
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                        }} 
                    />
                </div>
            }
        >
            <div style={{ minHeight: '130px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flexGrow: 1 }}>
                    <Tag color="geekblue" style={{ marginBottom: '8px' }}>{product.category_name || 'Без категории'}</Tag>
                    <Tooltip title={product.name}>
                        <Typography.Title level={5} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.name}
                        </Typography.Title>
                    </Tooltip>
                    <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        В наличии: {product.quantity} шт.
                    </Text>
                </div>
                
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: '1.4em' }}>{product.price} ₽</Text>
                    {(!userRole || userRole === 'client') && (
                         <Button
                            type="primary"
                            shape="circle"
                            icon={<ShoppingCartOutlined />}
                            onClick={() => addToCart(product)}
                        />
                    )}
                </div>
            </div>
        </Card>
    );
};

export default ProductCard;
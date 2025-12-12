// src/components/AuthModal.jsx (ФИНАЛЬНАЯ ВЕРСИЯ БЕЗ ЛИШНИХ БИБЛИОТЕК)
import React, { useContext } from 'react';
import { Modal, Form, Input, Button, Tabs, message } from 'antd';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const { TabPane } = Tabs;

const AuthModal = ({ open, onClose }) => {
    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();
    const { login } = useContext(AuthContext);

    const handleCancel = () => {
        loginForm.resetFields();
        registerForm.resetFields();
        onClose();
    };

    const onFinishRegister = async (values) => {
        try {
            const phoneDigits = values.phone.replace(/\D/g, '');
            const response = await axios.post('http://localhost:5000/api/auth/register', { ...values, phone: phoneDigits });
            message.success('Вы успешно зарегистрировались!');
            login(response.data.user, response.data.token);
            handleCancel();
        } catch (error) {
            message.error(error.response?.data?.message || 'Ошибка регистрации');
        }
    };
    
    const onFinishLogin = async (values) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', values);
            login(response.data.user, response.data.token);
            message.success(`Добро пожаловать, ${response.data.user.first_name}!`);
            handleCancel();
        } catch (error) {
            message.error(error.response?.data?.message || 'Ошибка входа');
        }
    };

    // --- НАША ФУНКЦИЯ ДЛЯ ФОРМАТИРОВАНИЯ ТЕЛЕФОНА ---
    const handlePhoneChange = (e) => {
        const input = e.target.value;
        const digits = input.replace(/\D/g, '').substring(0, 11);

        let formatted = '';
        if (digits.length > 0) {
            formatted = '+';
            if (digits.length > 1) {
                formatted += `${digits[0]} (${digits.substring(1, 4)}`;
            } else {
                formatted += `${digits[0]}`;
            }
            if (digits.length > 4) {
                formatted += `) ${digits.substring(4, 7)}`;
            }
            if (digits.length > 7) {
                formatted += `-${digits.substring(7, 9)}`;
            }
            if (digits.length > 9) {
                formatted += `-${digits.substring(9, 11)}`;
            }
        }
        
        // Обновляем значение в поле формы вручную
        registerForm.setFieldsValue({ phone: formatted });
    };

    return (
        <Modal
            title="Вход / Регистрация"
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnClose
        >
            <Tabs defaultActiveKey="1">
                <TabPane tab="Вход" key="1">
                    <Form form={loginForm} onFinish={onFinishLogin} layout="vertical">
                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                        <Form.Item name="password" label="Пароль" rules={[{ required: true }]}><Input.Password /></Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" block>Войти</Button></Form.Item>
                    </Form>
                </TabPane>
                <TabPane tab="Регистрация" key="2">
                    <Form form={registerForm} onFinish={onFinishRegister} layout="vertical">
                        <Form.Item name="first_name" label="Имя" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="last_name" label="Фамилия" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                        
                        {/* --- ИСПОЛЬЗУЕМ ОБЫЧНЫЙ INPUT С НАШЕЙ ЛОГИКОЙ --- */}
                        <Form.Item name="phone" label="Телефон" rules={[{ required: true, message: 'Введите номер телефона' }]}>
                            <Input 
                                placeholder="+7 (999) 123-45-67"
                                onChange={handlePhoneChange} // <-- Применяем нашу магию
                                maxLength={18}
                            />
                        </Form.Item>
                        
                        <Form.Item name="password" label="Пароль" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" block>Зарегистрироваться</Button></Form.Item>
                    </Form>
                </TabPane>
            </Tabs>
        </Modal>
    );
};

export default AuthModal;
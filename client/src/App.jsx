// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd'; // Импортируем ConfigProvider
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';

// Наша фирменная тема
const myTheme = {
  token: {
    colorPrimary: '#00b96b',    // Основной цвет (зеленый)
    colorWarning: '#f7931e',   // Цвет для акцентов (оранжевый)
    borderRadius: 6,
  },
};

function App() {
  return (
    <ConfigProvider theme={myTheme}> {/* Оборачиваем приложение в провайдер темы */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
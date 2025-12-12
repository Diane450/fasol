// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd'; // Импортируем ConfigProvider
import MainLayout from './components/MainLayout';
import HomePage from './pages/HomePage';
import { AuthProvider } from './context/AuthContext'; // <-- Импортируем

// Наша фирменная тема
const myTheme = {
  token: {
    colorPrimary: '#00b96b',
    colorWarning: '#f7931e',
    borderRadius: 6,
  },
};

function App() {
  return (
    <AuthProvider>
      <ConfigProvider theme={myTheme}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
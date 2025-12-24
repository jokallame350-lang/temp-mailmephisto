import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // App.tsx dosyasını çağırıyoruz
import './index.css' // Stilleri yüklüyoruz

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Root element bulunamadı!");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

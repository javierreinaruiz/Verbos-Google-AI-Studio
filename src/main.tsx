import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker for full offline and installability support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('VerboLingo ServiceWorker active:', reg.scope);
      })
      .catch((err) => {
        console.warn('ServiceWorker registration fallback:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);

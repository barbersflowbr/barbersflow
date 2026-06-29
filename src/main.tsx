import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Falha ao registrar Service Worker:', err);
      });
  });
} else if ('serviceWorker' in navigator && !import.meta.env.PROD) {
  // Optional: Also register in development to test offline capabilities locally
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((reg) => {
        console.log('[PWA Dev] Service Worker registrado com sucesso:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA Dev] Falha ao registrar Service Worker:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

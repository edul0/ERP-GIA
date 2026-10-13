import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
 window.addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(()=>{});});
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

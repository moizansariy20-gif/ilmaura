import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { checkDatabaseSchema } from './services/schemaChecker.ts';

// Register Service Worker for Push Notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Run database schema check
// checkDatabaseSchema();

const container = document.getElementById('root');

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (err) {
    console.error("EduControl: Critical mount failure:", err);
    container.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem; color: #ef4444; font-family: sans-serif; text-align: center; padding: 2rem;">
        <h1 style="margin: 0; font-size: 1.5rem;">Boot Error</h1>
        <p style="color: #64748b; max-width: 400px; font-size: 0.875rem;">The system failed to initialize. Please check the developer console for details.</p>
        <pre style="background: #fee2e2; padding: 1rem; border-radius: 0.5rem; font-size: 0.7rem; text-align: left; overflow: auto; width: 100%; max-width: 600px; border: 1px solid #fecaca;">${err instanceof Error ? err.stack : String(err)}</pre>
      </div>
    `;
  }
} else {
  console.error("EduControl: Root container '#root' not found.");
}
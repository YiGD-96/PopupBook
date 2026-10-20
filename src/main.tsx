import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initAnalytics } from './analytics';
import './styles.css';
import './reader.css';
import './cinematic.css';
initAnalytics();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

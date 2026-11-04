import React from 'react';
import { createRoot } from 'react-dom/client';
import GameApp from './Game.tsx';
import './game.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><GameApp/></React.StrictMode>);

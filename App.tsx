import React, { useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';

declare global {
  interface Window {
    Telegram: any;
  }
}

const App: React.FC = () => {
  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      // Set header color
      window.Telegram.WebApp.setHeaderColor('#0f172a'); 
    }
  }, []);

  return (
    <div className="w-full h-full">
      <GameCanvas />
    </div>
  );
};

export default App;
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SolanaProvider } from './providers/SolanaProvider';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolanaProvider>
      <App />
    </SolanaProvider>
  </StrictMode>,
);

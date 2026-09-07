import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import DownloadsPage from './pages/DownloadsPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DownloadsPage />
  </StrictMode>
);

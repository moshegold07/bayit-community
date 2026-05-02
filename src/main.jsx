import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider, getInitialLang, getDir } from './i18n';

// Set initial <html lang/dir> before React mounts so the first paint matches
// the user's stored / detected language and avoids an RTL/LTR flash.
const initialLang = getInitialLang();
document.documentElement.lang = initialLang;
document.documentElement.dir = getDir(initialLang);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);

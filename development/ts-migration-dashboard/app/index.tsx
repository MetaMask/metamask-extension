import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

const appElement = document.querySelector('#app');

if (appElement) {
  const root = createRoot(appElement);
  root.render(<App />);
}

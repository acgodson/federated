import React from 'react';
import ReactDOM from 'react-dom/client';
import LayoutWrapper from "./lib/components/template/layout-wrapper";
import App from './App';
// import './index.scss';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LayoutWrapper>
    <App />
    </LayoutWrapper>
  </React.StrictMode>,
);

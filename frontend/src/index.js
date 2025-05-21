import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './style.css'; // Updated import; style.css is now in src/

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
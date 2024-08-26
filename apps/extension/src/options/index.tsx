import React from 'react'
import ReactDOM from 'react-dom/client'

import '@/globals.css'

import App from './Options'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

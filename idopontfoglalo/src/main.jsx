import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/syne/700.css'
import '@fontsource/syne/800.css'
import '@fontsource/instrument-sans/400.css'
import '@fontsource/instrument-sans/500.css'
import '@fontsource/instrument-sans/600.css'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

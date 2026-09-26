import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/sofia-sans-condensed/700.css'
import '@fontsource/sofia-sans-condensed/800.css'
import '@fontsource/figtree/400.css'
import '@fontsource/figtree/600.css'
import '@fontsource/figtree/700.css'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

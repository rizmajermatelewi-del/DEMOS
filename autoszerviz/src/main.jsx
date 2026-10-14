import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '@fontsource/big-shoulders-display/700'
import '@fontsource/big-shoulders-display/800'
import '@fontsource/ibm-plex-sans/400'
import '@fontsource/ibm-plex-sans/500'
import '@fontsource/ibm-plex-sans/600'
import '@fontsource/ibm-plex-mono/500'
import '@fontsource/caveat/500'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

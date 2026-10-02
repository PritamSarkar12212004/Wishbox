import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installImageFallback } from './lib/image'

// Dead or blocked image URLs degrade to a local placeholder, never a broken icon.
installImageFallback()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

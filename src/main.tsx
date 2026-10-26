import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { installImageFallback } from './lib/image'
import { queryClient } from './lib/api/queryClient'
import { SiteContentSync } from './modules/site/api/useSiteContent'

// Dead or blocked image URLs degrade to a local placeholder, never a broken icon.
installImageFallback()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* One cache for the whole app: every account screen reads from here. */}
    <QueryClientProvider client={queryClient}>
      {/* Website content (alert strip, footer, contact page) from the API. */}
      <SiteContentSync />
      <App />
    </QueryClientProvider>
  </StrictMode>
)

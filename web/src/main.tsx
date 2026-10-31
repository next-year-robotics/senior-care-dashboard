import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { captureInstallPrompt } from './lib/install'
import { registerServiceWorker } from './lib/push'
import './index.css'

captureInstallPrompt()
void registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

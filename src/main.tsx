import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { MsalProvider } from '@azure/msal-react'
import { store } from './store'
import { msalInstance, initializeMsal } from './services/auth/msalInstance'
import './index.css'
import App from './App.tsx'

// Initialize MSAL before rendering
initializeMsal().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <Provider store={store}>
          <App />
        </Provider>
      </MsalProvider>
    </StrictMode>,
  )
})

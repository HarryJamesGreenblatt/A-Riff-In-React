import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './store'
import { MsalProvider } from '@azure/msal-react'

import { msalInstance, initializeMsal } from './services/auth/msalInstance'


import { useEffect, useState } from 'react';

const RootApp = () => {
  const [msalReady, setMsalReady] = useState(false);
  useEffect(() => {
    initializeMsal().then(() => setMsalReady(true));
  }, []);
  if (!msalReady) return <div>Loading authentication...</div>;
  // msalInstance is guaranteed to be non-null after initializeMsal() resolves
  return (
    <React.StrictMode>
      <MsalProvider instance={msalInstance!}>
        <Provider store={store}>
          <App />
        </Provider>
      </MsalProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RootApp />
);

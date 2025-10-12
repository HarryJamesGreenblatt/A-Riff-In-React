import React, { useEffect, useState } from 'react';

const AuthTest: React.FC = () => {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    // Check what environment variables are actually loaded
    setConfig({
      clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
      tenantId: import.meta.env.VITE_ENTRA_TENANT_ID,
      redirectUri: import.meta.env.VITE_REDIRECT_URI,
      userFlowAuthority: import.meta.env.VITE_ENTRA_USER_FLOW_AUTHORITY,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>🔍 Auth Configuration Test</h1>
      <h2>Environment Variables (Loaded by Vite)</h2>
      <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </div>
      
      <h2>✅ Configuration Checklist</h2>
      <ul>
        <li>
          <strong>Client ID:</strong> {config.clientId ? '✅ Set' : '❌ Missing'}
          {config.clientId && <span> ({config.clientId})</span>}
        </li>
        <li>
          <strong>Tenant ID:</strong> {config.tenantId ? '✅ Set' : '❌ Missing'}
          {config.tenantId && <span> ({config.tenantId})</span>}
        </li>
        <li>
          <strong>Redirect URI:</strong> {config.redirectUri ? '✅ Set' : '❌ Missing'}
          {config.redirectUri && <span> ({config.redirectUri})</span>}
        </li>
        <li>
          <strong>User Flow Authority:</strong> {config.userFlowAuthority ? '✅ Set' : '❌ Missing (Required for Google/social login)'}
          {config.userFlowAuthority && (
            <div style={{ marginLeft: '1.5rem', fontSize: '0.9em', color: '#666' }}>
              {config.userFlowAuthority}
            </div>
          )}
        </li>
      </ul>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
        <h3>⚠️ Important Notes</h3>
        <ul>
          <li>If any values show as <code>undefined</code>, restart the dev server: <code>npm run dev</code></li>
          <li>The User Flow Authority is REQUIRED for Google and social sign-in to work</li>
          <li>Client ID must match the app registration in your External ID user flow</li>
          <li>After updating .env files, always restart the dev server</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <a href="/register" style={{ 
          display: 'inline-block',
          padding: '0.5rem 1rem',
          background: '#0078d4',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Go to Register Page to Test SSO
        </a>
      </div>
    </div>
  );
};

export default AuthTest;

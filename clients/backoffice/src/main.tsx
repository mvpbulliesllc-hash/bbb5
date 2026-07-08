import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { ConvexProviderWithAuth0 } from 'convex/react-auth0';
import { ConvexReactClient } from 'convex/react';
import App from './App';
import './styles.css';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN as string}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID as string}
      authorizationParams={{ redirect_uri: window.location.origin }}
      useRefreshTokens
      cacheLocation="localstorage"
    >
      <ConvexProviderWithAuth0 client={convex}>
        <App />
      </ConvexProviderWithAuth0>
    </Auth0Provider>
  </React.StrictMode>
);

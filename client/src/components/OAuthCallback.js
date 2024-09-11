import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const OAuthCallback = ({ onAuthenticated }) => {
  const location = useLocation();

  useEffect(() => {
    // Get the authorization code from the URL query params
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');

    if (code) {
      // Exchange authorization code for tokens
      axios.get(`http://localhost:5000/oauth2callback?code=${code}`)
        .then(response => {
          const tokens = response.data;
          // Pass the tokens back to the parent App component
          onAuthenticated(tokens);
        })
        .catch(error => {
          console.error('Error during OAuth callback:', error.response ? error.response.data : error.message);
        });
    }
  }, [location, onAuthenticated]);

  return <div>Authenticating...</div>;
};

export default OAuthCallback;

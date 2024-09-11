import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OAuthLogin from './components/OAuthLogin';
import CreateMeet from './components/CreateMeet';
import OAuthCallback from './components/OAuthCallback'; // New component for handling the OAuth callback

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokens, setTokens] = useState(null);

  // This function will be passed to OAuthLogin to handle the authentication
  const handleAuthentication = (tokens) => {
    setTokens(tokens);
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Route for OAuth login page */}
          <Route 
            path="/" 
            element={<OAuthLogin onAuthenticated={handleAuthentication} />} 
          />
          
          {/* Route for OAuth callback that will exchange code for tokens */}
          <Route 
            path="/oauth2callback"
            element={<OAuthCallback onAuthenticated={handleAuthentication} />}
          />

          {/* After authentication, user is redirected here */}
          <Route 
            path="/create-meet" 
            element={isAuthenticated ? <CreateMeet tokens={tokens} /> : <OAuthLogin onAuthenticated={handleAuthentication} />} 
          />
          
        </Routes>
      </div>
    </Router>
  );
};

export default App;

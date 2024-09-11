import React from 'react';

const OAuthLogin = () => {
  const handleGoogleLogin = () => {
    const authUrl = 'http://localhost:5000/auth/google'; // Backend OAuth route
    window.open(authUrl, '_self'); // Redirect to Google OAuth via backend
  };

  return (
    <div className="p-4">
      <button
        onClick={handleGoogleLogin}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Login with Google
      </button>
    </div>
  );
};

export default OAuthLogin;

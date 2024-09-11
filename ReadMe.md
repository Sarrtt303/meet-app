Setting up the API:

1. Google Cloud Console is used to make a new project and use the Google Calendar API.
2. Create credentials for yoour API. The Required credentials are: CLIENT ID, CLIENT SECRET, API KEY, ACCESTOKEN and REDIRECT URI. 
3. 





Token Storage (storeTokens): Implement a secure method to store tokens, possibly in a database or a secure storage mechanism. For now, it's saving to environment variables, but you should use a more secure method in production.

Token Refresh (refreshTokens): Added a function to refresh tokens when they are about to expire.

Middleware for Token Handling: Before processing requests, check if the token is about to expire and refresh it if necessary.

Unique Request ID for Meet Creation: Added a unique request ID using crypto.randomBytes to ensure that each meeting creation request is unique.
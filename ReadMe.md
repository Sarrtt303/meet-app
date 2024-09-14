Setting up the API:

1. Google Cloud Console is used to make a new project and use the Google Calendar API,
   which can create events such as google meet.

2. Create credentials for your API. The Required credentials are: CLIENT ID, CLIENT SECRET, API KEY, ACCESTOKEN, REFRESHTOKEN and REDIRECT URI(Ensure that your
   Javascript Original URI in the console is your local frontend port, eg: localhost:3000 and your Redirect URI is your backend port with the /oauth2callback enpoint, eg: localhost:5000/oauth2callback). 
   **All Credentials and API keys should be saved inside a .env file**
3. Initialise an oAuth2Client using the enviornment varaibles created from google cloud console.

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

4. In the backend create a /auth/google endpoint that will contain the scopes to
for required google api resources. For meet we need the following scopes
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'

    The api will require some configurations to work with the requests and send out responses.

    const authorizationUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

    We use these scopes to redirect the user when login button is clicked, the page is rediercted to a google Oauth page that lets the user sign in with 
    their gmail account.
    NOTE: Only the emails present in the google console can access the oauth process before the production stage

5. A callback endpoint should be set up in the backend, so that the frontend 'GET' function can recieve the tokens and do the authentication,
   the tokens are then passed into oauth credentials to let the google Api know what tokens are generated.


6. TOKEN MANAGEMENT: 

       a. Token Storage (storeTokens): Implemented a secure method to store tokens, using a mongoD database. 
         
        const token = new Token({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: expiryDate,
         });

         * A suitable mongoDb Model is created for tthis operation. 

       b. Token Refresh (refreshTokens): Added a function to refresh tokens when they are about to expire.  This results in seamless usage of the api.

       c. Middleware for Token Handling: Before processing requests, check if the token is about to expire and refresh it if necessary. This is done

 7. Using the Calendar API, a meeting event is created in the /create-meet endpoint, using the access token and refresh token as credentials. 


 8. Tailwind CSS is configured into the frontend (no postcss) and with react integration using, 
     npm install -D tailwindcss
     npx tailwindcss init
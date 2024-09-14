const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Token = require('./models/Token'); // Token model
const connectDB = require('./db/Db'); // MongoDB connection logic
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
}));

app.use(express.json());

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Function to store tokens securely in MongoDB
async function storeTokens(tokens) {
  try {
    // Calculate the expiry date from the access token expiry time
    const expiresIn = tokens.expires_in || 3600; // Default to 1 hour (3600 seconds) if undefined
    const expiryDate = new Date(Date.now() + expiresIn * 1000);
    console.log('Calculated expiryDate:', expiryDate);

    // Check if expiryDate is valid
    if (isNaN(expiryDate.getTime())) {
      throw new Error('Invalid expiryDate'); // Log error if expiryDate is invalid
    }

    // Create a new token instance
    const token = new Token({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: expiryDate,
    });

    // Save the token in MongoDB
    await token.save();
    console.log('Tokens stored successfully');
  } catch (error) {
    console.error('Error storing tokens:', error);
  }
}


const refreshTokens = async (tokenData) => {
  try {
    // Refresh the access token
    const tokens = await oAuth2Client.refreshAccessToken();
    const { access_token, refresh_token, expiry_date } = tokens.credentials;

    // Update the token data in MongoDB
    tokenData.accessToken = access_token;
    if (refresh_token) {
      tokenData.refreshToken = refresh_token; // Only update refresh token if a new one is provided
    }
    tokenData.expiryDate = new Date(expiry_date); // Set the new expiry date
    await tokenData.save();  // Save the updated token document

    // Set the new credentials in OAuth2 client
    oAuth2Client.setCredentials({
      access_token: access_token,
      refresh_token: tokenData.refreshToken
    });

    console.log('Tokens refreshed and updated in DB');
  } catch (error) {
    console.error('Failed to refresh tokens:', error);
    throw new Error('Failed to refresh tokens');
  }
};



// Redirect user to Google's OAuth 2.0 consent screen
app.get('/auth/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const authorizationUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  console.log('Authorization URL:', authorizationUrl);
  res.redirect(authorizationUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  console.log('Recieved authorization code:', code);
  
  try {
    console.log('Exchanging tokens...');
    const { tokens } = await oAuth2Client.getToken(code); // Exchange code for tokens
    console.log('Received tokens:', JSON.stringify(tokens, null, 2));
    oAuth2Client.setCredentials(tokens); // Set credentials
    
    
    // Ensure you have the refreshToken
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received');

    }
    // Ensure tokens are valid
    if (!tokens) {
      throw new Error('Token exchange failed');
    }

    
    console.log('Received tokens:', tokens);

    // Store tokens in the database
    await storeTokens(tokens);

    console.log('Tokens successfully stored:', tokens);
    res.redirect('http://localhost:3000/create-meet');  // Redirect to frontend after successful auth
  } catch (error) {
    console.error('Error storing tokens:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    res.status(500).send('Authentication failed');
  }
});


// Middleware to refresh tokens when necessary
app.use(async (req, res, next) => {
  try {
    // Fetch tokens from MongoDB
    const tokenData = await Token.findOne();  // Assuming you're using a single document for tokens

    if (!tokenData || !tokenData.accessToken || !tokenData.refreshToken) {
      return res.status(401).json({ error: 'No tokens found' });
    }

    // Set OAuth2 client credentials with access and refresh tokens
    oAuth2Client.setCredentials({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken
    });

    // Check if the access token is expired or about to expire
    const now = new Date();
    if (tokenData.expiryDate <= now) {
      await refreshTokens(tokenData);  // Call the function to refresh and update tokens in the DB
    }

    next();
  } catch (error) {
    console.error('Error in token middleware:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// Check if the current session is authenticated
app.get('/api/check-auth', async (req, res) => {
  try {
    // The token middleware will already ensure token is valid or refreshed
    const token = await Token.findOne();

    if (token && token.accessToken) {
      res.json({ isAuthenticated: true });
    } else {
      res.json({ isAuthenticated: false });
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a Google Meet link and calendar event
app.post('/create-meeting', async (req, res) => {
  try {
    // Extract tokens and set credentials
    const { access_token, refresh_token } = req.body.tokens;
    oAuth2Client.setCredentials({
      access_token,
      refresh_token
    });
    
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Create a calendar event with Google Meet link
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    const event = {
      summary: 'Google Meet Event',
      description: 'A meeting via Google Meet',
      start: {
        dateTime: now.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: oneHourLater.toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),  // A unique request ID
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
    };

    const calendarResponse = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    res.json({
      meetingLink: calendarResponse.data.hangoutLink,
      eventId: calendarResponse.data.id,
      startTime: now.toISOString(),
      endTime: oneHourLater.toISOString()
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

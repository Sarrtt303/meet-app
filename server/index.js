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


// Function to refresh tokens
async function refreshTokens() {
  try {
    console.log('Refreshing tokens...');
    const { credentials } = await oAuth2Client.refreshAccessToken();
    console.log('New tokens:', credentials);

    // Set new credentials
    oAuth2Client.setCredentials(credentials);

    // Update token in database
    await Token.findOneAndUpdate(
      { accessToken: oAuth2Client.credentials.access_token },
      {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token,
        expiryDate: new Date(Date.now() + credentials.expires_in * 1000)
      },
      { new: true }
    );

    console.log('Tokens refreshed successfully');
  } catch (error) {
    console.error('Error refreshing tokens:', error);
  }
}


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

  res.redirect(authorizationUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oAuth2Client.getToken(code); // Exchange code for tokens
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
    res.status(500).send('Authentication failed');
  }
});


// Middleware to refresh tokens when necessary
app.use(async (req, res, next) => {
  if (!oAuth2Client.credentials || !oAuth2Client.credentials.access_token) {
    oAuth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }

  if (oAuth2Client.isTokenExpiring()) {
    await refreshTokens();
  }

  next();
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

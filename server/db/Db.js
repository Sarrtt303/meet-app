const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const connectDB = async () => {
  try {
    // Make sure the URI is properly read from the environment
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in the .env file');
    }

    await mongoose.connect(mongoURI, {
      
    });

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Stop the application if the connection fails
  }
};

module.exports = connectDB;

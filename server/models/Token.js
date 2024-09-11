const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiryDate: { type: Date, required: true } // Store the calculated expiry date
});

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;

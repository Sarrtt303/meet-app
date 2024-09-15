const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  meetingLink: { type: String, required: true },
  eventId: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true }
});

const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports = Meeting;

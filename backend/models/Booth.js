const mongoose = require('mongoose');

const boothSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  exhibitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Null means it's not booked yet
  },
  boothNumber: {
    type: String,
    required: true
  },
  zone: {
    type: String,
    default: 'Hall A'
  },
  size: {
    type: String,
    default: '3m x 3m'
  },
  price: {
    type: Number,
    default: 500
  },
  status: {
    type: String,
    enum: ['Available', 'Pending', 'Booked'],
    default: 'Available'
  },
  // These store the X and Y coordinates for your HTML5 Canvas floor plan
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('Booth', boothSchema);
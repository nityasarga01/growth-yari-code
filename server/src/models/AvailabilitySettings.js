const mongoose = require('mongoose');

const availabilitySettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  offersFreeSessions: {
    type: Boolean,
    default: false
  },
  freeSessionDuration: {
    type: Number,
    default: 30,
    min: 15,
    max: 60
  },
  defaultPaidDuration: {
    type: Number,
    default: 60,
    min: 30,
    max: 180
  },
  defaultPaidPrice: {
    type: Number,
    default: 75,
    min: 0
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  bufferTime: {
    type: Number,
    default: 15,
    min: 0,
    max: 60
  },
  advanceBookingDays: {
    type: Number,
    default: 30,
    min: 1,
    max: 90
  }
}, {
  timestamps: true
});

// Index for better performance
availabilitySettingsSchema.index({ userId: 1 });

module.exports = mongoose.model('AvailabilitySettings', availabilitySettingsSchema);
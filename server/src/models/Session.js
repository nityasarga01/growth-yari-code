const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 180
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'completed', 'cancelled']
  },
  meetingLink: String,
  notes: String
}, {
  timestamps: true
});

// Indexes for better performance
sessionSchema.index({ expertId: 1, scheduledAt: 1 });
sessionSchema.index({ clientId: 1, scheduledAt: 1 });
sessionSchema.index({ status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
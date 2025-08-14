const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  slotType: {
    type: String,
    required: true,
    enum: ['free', 'paid', 'blocked']
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 180
  },
  isBooked: {
    type: Boolean,
    default: false
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly']
  },
  recurringUntil: Date,
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better performance
availabilitySlotSchema.index({ userId: 1, date: 1 });
availabilitySlotSchema.index({ date: 1, startTime: 1 });
availabilitySlotSchema.index({ isBooked: 1 });

// Validation to ensure end time is after start time
availabilitySlotSchema.pre('save', function(next) {
  const startTime = this.startTime.split(':').map(Number);
  const endTime = this.endTime.split(':').map(Number);
  
  const startMinutes = startTime[0] * 60 + startTime[1];
  const endMinutes = endTime[0] * 60 + endTime[1];
  
  if (endMinutes <= startMinutes) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

module.exports = mongoose.model('AvailabilitySlot', availabilitySlotSchema);
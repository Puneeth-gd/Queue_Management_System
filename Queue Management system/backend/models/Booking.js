const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  patientName: { type: String, required: true },
  phone: { type: String },
  age: { type: Number },
  hospital: { type: String, default: 'City General Hospital' },
  department: { type: String, default: 'General Medicine' },
  doctor: { type: String, default: 'Dr. Meera Sharma' },
  slot: { type: String },
  status: { 
    type: String, 
    enum: ['booked', 'waiting', 'in-consultation', 'completed', 'skipped', 'cancelled'], 
    default: 'booked' 
  },
  urgent: { type: Boolean, default: false },
  arrived: { type: Boolean, default: false },
  waitMins: { type: Number, default: 0 },
  complaint: { type: String },
  isWalkIn: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);

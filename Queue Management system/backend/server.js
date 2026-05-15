/**
 * ============================================================
 *  MediQueue AI — Full Backend Server
 *  Node.js + Express + MongoDB + Socket.io + SMS
 * 
 *  HOW TO RUN:
 *    1. Install Node.js (https://nodejs.org/)
 *    2. Open terminal in this folder and run: `npm install`
 *    3. Edit .env file and add your MongoDB URL and SMS key
 *    4. Run: `node server.js`
 * ============================================================
 */

require('dotenv').config();

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const axios      = require('axios');
const morgan     = require('morgan');

const Booking    = require('./models/Booking');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });
const PORT   = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));

// ── MongoDB Connection ──────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mediqueue';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// ── Socket.io Real-Time Layer ────────────────────────────────
io.on('connection', (socket) => {
  console.log(`📡 New Web Client Connected: ${socket.id}`);
  
  // They can explicitly ask to join a hospital "room"
  socket.on('joinHospital', (hospitalName) => {
    socket.join(hospitalName);
    console.log(`Client ${socket.id} joined ${hospitalName}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔻 Client disconnected: ${socket.id}`);
  });
});

// Broadcast helper
function notifyQueueUpdate(hospital) {
  io.emit('queue_updated', { message: 'The queue has changed!', timestamp: new Date() });
}

// ── API: Queue & Bookings ───────────────────────────────────

// GET: Fetch all active queue items
app.get('/api/queue', async (req, res) => {
  try {
    const queue = await Booking.find({ status: { $in: ['waiting', 'in-consultation'] } }).sort({ createdAt: 1 });
    res.json({ success: true, count: queue.length, data: queue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST: Create a new booking (Patient Portal)
app.post('/api/book', async (req, res) => {
  try {
    const { token, patientName, phone, hospital, department, doctor, slot } = req.body;
    
    const newBooking = new Booking({
      token: token || `T-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientName || 'Web Patient',
      phone, hospital, department, doctor, slot,
      status: 'booked'
    });

    await newBooking.save();
    notifyQueueUpdate(hospital); // Alert connected screens
    res.status(201).json({ success: true, data: newBooking });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST: Add a Walk-in (Receptionist Portal)
app.post('/api/walkin', async (req, res) => {
  try {
    const { patientName, complaint, urgent, age, doctor } = req.body;
    
    // Auto-generate token W-XXXX
    const token = `W-${Math.floor(1000 + Math.random() * 9000)}`;
    const newWalkIn = new Booking({
      token, patientName, complaint, urgent: Boolean(urgent), age, doctor,
      isWalkIn: true,
      status: 'waiting',
      arrived: true
    });

    await newWalkIn.save();
    notifyQueueUpdate(); 
    res.status(201).json({ success: true, data: newWalkIn });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT: Doctor updates status (Done, Skip, Move to Front)
app.put('/api/queue/:token/status', async (req, res) => {
  try {
    const { status, urgent } = req.body; // status: 'completed', 'skipped', etc. 'urgent': true
    const updatePayload = {};
    if (status) updatePayload.status = status;
    if (urgent !== undefined) updatePayload.urgent = urgent;

    const query = await Booking.findOneAndUpdate({ token: req.params.token }, updatePayload, { new: true });
    
    if (!query) return res.status(404).json({ success: false, error: 'Token not found' });

    notifyQueueUpdate();
    res.json({ success: true, data: query });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ── API: SMS Functionality (Moved from older script) ─────────
const smsLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
function isValidPhone(phone) { return /^(\+91|91)?[6-9]\d{9}$/.test(phone.replace(/\s+/g, '')); }

app.post('/api/send-sms', smsLimiter, async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ success: false, error: 'Missing phone or message.' });
  if (!isValidPhone(phone)) return res.status(400).json({ success: false, error: 'Invalid config' });

  try {
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) throw new Error("No SMS_API_KEY");
    
    // Dummy REST logic to act as scaffold
    console.log(`[SMS MOCK] To: ${phone} | Msg: ${message}`);
    res.json({ success: true, msg: "Dev simulated SMS." });
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Global Error / 404 ───────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found.' }));

// ── Start server ──────────────────────────────────────────
server.listen(PORT, () => {
  console.log('\\n  🏥 MediQueue AI — FULL Stack Backend');
  console.log(`  🚀 Server Running at http://localhost:${PORT}`);
  console.log(`  🔗 Socket.io Enabled`);
  console.log('');
});

/* =====================================================
   AI Hospital Queue Management System — Shared App Logic
   ===================================================== */

// ─── Global State ─────────────────────────────────────
window.HospitalApp = window.HospitalApp || {};

const App = window.HospitalApp;

App.state = {
  isOnline: navigator.onLine,
  emergencyActive: false,
  doctorStatus: 'available', // available | busy | emergency | offline
  currentToken: 'T-047',
  queuePaused: false,
};

// ─── Hospitals & Departments ──────────────────────────
App.hospitals = [
  { id: 'h1', name: 'City General Hospital', address: '14 MG Road, Downtown', rating: 4.7 },
  { id: 'h2', name: 'Apollo Multi-Specialty', address: '8 Ring Road, Sector 5', rating: 4.9 },
  { id: 'h3', name: 'Sunrise Medical Center', address: '22 Park Ave, Midtown', rating: 4.5 },
];

App.departments = [
  { id: 'd1', name: 'Cardiology', icon: '🫀', color: '#fc8181' },
  { id: 'd2', name: 'Neurology', icon: '🧠', color: '#b794f4' },
  { id: 'd3', name: 'Orthopedics', icon: '🦴', color: '#63b3ed' },
  { id: 'd4', name: 'Dermatology', icon: '🩺', color: '#68d391' },
  { id: 'd5', name: 'Pediatrics', icon: '👶', color: '#f6ad55' },
  { id: 'd6', name: 'General Medicine', icon: '💊', color: '#4fd1c5' },
  { id: 'd7', name: 'Ophthalmology', icon: '👁️', color: '#9f7aea' },
  { id: 'd8', name: 'ENT', icon: '👂', color: '#ed8936' },
];

App.doctors = [
  { id: 'dr1', name: 'Dr. Meera Sharma', dept: 'd1', hospital: 'h1', exp: '18 yrs', rating: 4.9, avatar: '👩‍⚕️', status: 'available', fee: '₹800' },
  { id: 'dr2', name: 'Dr. Raj Patel', dept: 'd2', hospital: 'h1', exp: '14 yrs', rating: 4.7, avatar: '👨‍⚕️', status: 'busy', fee: '₹1200' },
  { id: 'dr3', name: 'Dr. Ananya Singh', dept: 'd3', hospital: 'h2', exp: '22 yrs', rating: 4.8, avatar: '👩‍⚕️', status: 'available', fee: '₹900' },
  { id: 'dr4', name: 'Dr. Vikram Nair', dept: 'd4', hospital: 'h2', exp: '10 yrs', rating: 4.6, avatar: '👨‍⚕️', status: 'available', fee: '₹600' },
  { id: 'dr5', name: 'Dr. Priya Iyer', dept: 'd5', hospital: 'h3', exp: '12 yrs', rating: 4.8, avatar: '👩‍⚕️', status: 'emergency', fee: '₹700' },
  { id: 'dr6', name: 'Dr. Arjun Mehta', dept: 'd6', hospital: 'h1', exp: '8 yrs', rating: 4.5, avatar: '👨‍⚕️', status: 'available', fee: '₹500' },
];

// ─── Live Queue (shared mock state) ──────────────────
App.queue = [
  { token: 'T-044', name: 'Ramesh K.', status: 'in-consultation', waiting: 0, urgent: false, arrived: true, avatar: 'RK' },
  { token: 'T-045', name: 'Sunita D.', status: 'waiting', waiting: 8, urgent: false, arrived: true, avatar: 'SD' },
  { token: 'T-046', name: 'Arif M.', status: 'waiting', waiting: 16, urgent: false, arrived: true, avatar: 'AM' },
  { token: 'T-047', name: 'Yash V.', status: 'waiting', waiting: 24, urgent: false, arrived: false, avatar: 'YV' },
  { token: 'T-048', name: 'Geeta R.', status: 'waiting', waiting: 32, urgent: false, arrived: true, avatar: 'GR' },
  { token: 'T-049', name: 'Mohit S.', status: 'waiting', waiting: 40, urgent: false, arrived: false, avatar: 'MS' },
  { token: 'T-050', name: 'Priya L.', status: 'waiting', waiting: 48, urgent: false, arrived: true, avatar: 'PL' },
];

App.doctorQueue = [
  { token: 'T-044', name: 'Ramesh Kumar', age: 62, status: 'in-consultation', urgent: false, arrived: true, complaint: 'Chest pain evaluation', avatar: 'RK' },
  { token: 'T-045', name: 'Sunita Devi', age: 45, status: 'waiting', urgent: false, arrived: true, complaint: 'Follow-up – hypertension', avatar: 'SD' },
  { token: 'T-046', name: 'Arif Mohammad', age: 38, status: 'waiting', urgent: false, arrived: true, complaint: 'Palpitations since 3 days', avatar: 'AM' },
  { token: 'T-047', name: 'Pooja Verma', age: 29, status: 'waiting', urgent: false, arrived: false, complaint: 'Routine ECG check', avatar: 'PV' },
  { token: 'T-048', name: 'Geeta Rao', age: 55, status: 'waiting', urgent: false, arrived: true, complaint: 'Shortness of breath', avatar: 'GR' },
  { token: 'T-049', name: 'Mohit Singh', age: 34, status: 'waiting', urgent: false, arrived: false, complaint: 'Routine check-up', avatar: 'MS' },
];

App.emergencyAlert = null;
App.notifications = [];

// ─── Utility: Toast ──────────────────────────────────
App.toast = function(title, message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '🚨', warning: '⚠️', info: 'ℹ️' };
  const id = 'toast-' + Date.now();

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.id = id;
  el.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" onclick="App.removeToast('${id}')">✕</button>
  `;
  container.appendChild(el);

  if (duration > 0) {
    setTimeout(() => App.removeToast(id), duration);
  }
};

App.removeToast = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('hide');
  setTimeout(() => el.remove(), 400);
};

// ─── Utility: Format time ─────────────────────────────
App.formatTimer = function(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ─── Utility: Token generator ─────────────────────────
App.generateToken = function(prefix = 'T') {
  const num = Math.floor(Math.random() * 50) + 51;
  return `${prefix}-0${num}`;
};

// ─── Online / Offline Detection ──────────────────────
window.addEventListener('online', () => {
  App.state.isOnline = true;
  const banner = document.getElementById('offline-banner');
  if (banner) banner.classList.add('hidden');
  App.toast('Back Online', 'Queue data synced successfully.', 'success');
});

window.addEventListener('offline', () => {
  App.state.isOnline = false;
  const banner = document.getElementById('offline-banner');
  if (banner) banner.classList.remove('hidden');
  App.toast('Offline Mode', 'Showing last known queue state.', 'warning', 0);
});

// ─── QR Code Visual Generator ───────────────────────
App.generateQR = function(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const pattern = [
    [1,1,1,0,1,1,1],
    [1,0,1,0,1,0,1],
    [1,1,1,0,1,1,1],
    [0,0,1,1,0,1,0],
    [1,1,1,0,1,1,1],
    [1,0,1,0,0,0,1],
    [1,1,1,0,1,0,1],
  ];
  const grid = document.createElement('div');
  grid.className = 'qr-pattern';
  pattern.forEach(row => {
    row.forEach(cell => {
      const d = document.createElement('div');
      d.className = 'qr-cell' + (cell ? '' : ' empty');
      grid.appendChild(d);
    });
  });
  el.innerHTML = '';
  el.appendChild(grid);
};

// ─── Dark mode ───────────────────────────────────────
App.toggleDarkMode = function() {
  document.body.classList.toggle('light-mode');
  const thumb = document.querySelector('.dark-toggle-thumb');
  if (thumb) {
    const isLight = document.body.classList.contains('light-mode');
    thumb.style.transform = isLight ? 'translateX(0)' : 'translateX(24px)';
    thumb.textContent = isLight ? '☀️' : '🌙';
  }
};

// ─── Simulate live queue drift ───────────────────────
App.startLiveSimulation = function(callback) {
  let tick = 0;
  return setInterval(() => {
    tick++;
    // Every 15 ticks reduce waiting times
    if (tick % 15 === 0) {
      App.queue.forEach(p => { if (p.waiting > 0) p.waiting = Math.max(0, p.waiting - 8); });
      if (callback) callback('queue_update');
    }
    // Random emergency alert at tick 40
    if (tick === 40 && !App.state.emergencyActive) {
      App.state.emergencyActive = true;
      App.emergencyAlert = { msg: '🚨 Dr. Meera Sharma delayed — Emergency surgery in progress', time: new Date() };
      App.queue.forEach(p => { p.waiting += 15; });
      if (callback) callback('emergency');
    }
    // Resolve emergency at tick 70
    if (tick === 70 && App.state.emergencyActive) {
      App.state.emergencyActive = false;
      App.emergencyAlert = null;
      if (callback) callback('emergency_resolved');
    }
  }, 1000);
};

App.patientHistories = {
  'T-044': [
    { date: '2026-01-15', note: 'Patient complained of lower back pain after lifting box. Prescribed rest.' },
    { date: '2026-03-02', note: 'Reports left leg numbness and tingling, back pain slightly worse. Refers to physio.' }
  ],
  'T-045': [
    { date: '2025-11-10', note: 'Standard checkup. Cholesterol slightly high. Advice on diet.' }
  ],
  'T-047': [
    { date: '2025-12-05', note: 'Minor skin rash on arm. Allergic reaction suspected.' },
    { date: '2026-02-12', note: 'Itching returned, spread to neck. Prescribed antihistamines.' }
  ]
};

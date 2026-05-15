/* =====================================================
   MediQueue AI — Frontend SMS Service
   Talks to the Node.js backend at /api/send-sms.
   The API key NEVER lives here — it's on the server.
   ===================================================== */

const SMS = (() => {

  // ── Config ────────────────────────────────────────────
  // Change this if your backend runs on a different port
  const BACKEND_URL = 'http://localhost:3001/api/send-sms';

  // Hospital branding used in messages
  const HOSPITAL_TAG = 'MediQueue AI';

  // Toggle: user can enable / disable SMS globally
  let smsEnabled = JSON.parse(localStorage.getItem('smsEnabled') ?? 'true');

  // ── Internal: build a short message (max 160 chars) ──
  function compose(lines) {
    return lines.filter(Boolean).join('\n').slice(0, 160);
  }

  // ── Internal: POST to backend with retry ─────────────
  async function callBackend(phone, message, event, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message, event }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        return { success: true, data };

      } catch (err) {
        console.warn(`[SMS] Attempt ${attempt}/${retries} failed:`, err.message);
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1200 * attempt)); // back-off
        } else {
          return { success: false, error: err.message };
        }
      }
    }
  }

  // ── Phone validator (10-digit Indian) ─────────────────
  function isValidPhone(phone) {
    const cleaned = phone.replace(/\s+/g, '');
    return /^(\+91|91)?[6-9]\d{9}$/.test(cleaned);
  }

  // ── Public: send with guard-rails ─────────────────────
  async function send(phone, message, event) {
    if (!smsEnabled) {
      console.info('[SMS] Alerts disabled by user — skipped');
      return { success: false, skipped: true };
    }
    if (!phone || !isValidPhone(phone)) {
      console.warn('[SMS] Invalid or missing phone number:', phone);
      return { success: false, error: 'Invalid phone number' };
    }
    return callBackend(phone, message, event);
  }

  // ═══════════════════════════════════════════════════════
  // TEMPLATE FUNCTIONS — one per SMS event
  // ═══════════════════════════════════════════════════════

  /**
   * 1. Booking confirmed → patient receives token
   */
  async function onBookingConfirmed({ phone, hospitalName, doctorName, token, slot, waitMins }) {
    const msg = compose([
      `[${HOSPITAL_TAG}] Booking Confirmed!`,
      `Hospital: ${hospitalName}`,
      `Doctor: ${doctorName}`,
      `Token: ${token} | Slot: ${slot}`,
      `Est. Wait: ${waitMins} mins`,
    ]);
    return send(phone, msg, 'booking_confirmed');
  }

  /**
   * 2. Walk-in token generated
   */
  async function onTokenGenerated({ phone, hospitalName, doctorName, token, waitMins }) {
    const msg = compose([
      `[${HOSPITAL_TAG}] Token Assigned`,
      `Hospital: ${hospitalName}`,
      `Doctor: ${doctorName}`,
      `Token: ${token} | Est. Wait: ${waitMins} mins`,
      `Please wait in the lounge.`,
    ]);
    return send(phone, msg, 'token_generated');
  }

  /**
   * 3. Emergency delay — doctor is held up
   */
  async function onEmergencyDelay({ phone, hospitalName, doctorName, extraWaitMins }) {
    const msg = compose([
      `[${HOSPITAL_TAG}] Emergency Delay`,
      `${doctorName} at ${hospitalName}`,
      `is delayed ~${extraWaitMins} mins due to an emergency.`,
      `We apologise for the wait.`,
    ]);
    return send(phone, msg, 'emergency_delay');
  }

  /**
   * 4. Almost your turn — 2 patients left ahead
   */
  async function onAlmostYourTurn({ phone, hospitalName, doctorName, token, patientsAhead }) {
    const msg = compose([
      `[${HOSPITAL_TAG}] Almost Your Turn!`,
      `Token: ${token} — ${patientsAhead} patient(s) ahead.`,
      `Dr. ${doctorName} | ${hospitalName}`,
      `Please be ready at the waiting area.`,
    ]);
    return send(phone, msg, 'almost_your_turn');
  }

  /**
   * 5. Booking cancelled
   */
  async function onBookingCancelled({ phone, hospitalName, doctorName, token, slot }) {
    const msg = compose([
      `[${HOSPITAL_TAG}] Booking Cancelled`,
      `Token: ${token} cancelled.`,
      `Dr. ${doctorName} | Slot: ${slot}`,
      `${hospitalName}. Rebook anytime.`,
    ]);
    return send(phone, msg, 'booking_cancelled');
  }

  // ── Toggle SMS globally ───────────────────────────────
  function toggleSmsAlerts(enabled) {
    smsEnabled = enabled;
    localStorage.setItem('smsEnabled', JSON.stringify(enabled));
    console.info('[SMS] Alerts', enabled ? 'ENABLED' : 'DISABLED');
  }

  function isSmsEnabled() { return smsEnabled; }

  // ── Preview a message before sending ─────────────────
  function previewMessage(templateFn, params) {
    // Returns composed text without sending
    return templateFn({ ...params, _preview: true });
  }

  // ── Public API ────────────────────────────────────────
  return {
    isValidPhone,
    isSmsEnabled,
    toggleSmsAlerts,
    onBookingConfirmed,
    onTokenGenerated,
    onEmergencyDelay,
    onAlmostYourTurn,
    onBookingCancelled,
  };

})();

// Make globally available
window.SMS = SMS;

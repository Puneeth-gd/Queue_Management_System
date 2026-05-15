/**
 * ============================================================
 *  MediQueue AI — SMS Message Templates
 *  All SMS text is composed here so it's easy to edit.
 *  Keep every message under 160 characters (1 SMS unit).
 * ============================================================
 */

const HOSPITAL_TAG = 'MediQueue AI';

/**
 * Truncates text to fit within 160 chars total.
 * Returns the constructed message string.
 */
function build(parts) {
  return parts.join('\n').slice(0, 160);
}

const Templates = {

  // 1. Appointment booked successfully
  bookingConfirmed({ hospitalName, doctorName, token, slot, waitMins }) {
    return build([
      `[${HOSPITAL_TAG}] Booking Confirmed!`,
      `Hospital: ${hospitalName}`,
      `Doctor: ${doctorName}`,
      `Token: ${token} | Slot: ${slot}`,
      `Est. Wait: ${waitMins} mins`,
    ]);
  },

  // 2. Token generated (walk-in)
  tokenGenerated({ hospitalName, doctorName, token, waitMins }) {
    return build([
      `[${HOSPITAL_TAG}] Token Assigned`,
      `Hospital: ${hospitalName}`,
      `Doctor: ${doctorName}`,
      `Your Token: ${token}`,
      `Est. Wait: ${waitMins} mins. Please wait in lounge.`,
    ]);
  },

  // 3. Emergency delay notification
  emergencyDelay({ hospitalName, doctorName, extraWaitMins }) {
    return build([
      `[${HOSPITAL_TAG}] Emergency Delay`,
      `${doctorName} at ${hospitalName} is delayed by ~${extraWaitMins} mins due to an emergency.`,
      `We apologise for the inconvenience.`,
    ]);
  },

  // 4. Queue almost reached (2 patients ahead)
  almostYourTurn({ hospitalName, doctorName, token, patientsAhead }) {
    return build([
      `[${HOSPITAL_TAG}] Almost Your Turn!`,
      `Token: ${token} | ${patientsAhead} patient(s) ahead.`,
      `Dr. ${doctorName} at ${hospitalName}.`,
      `Please be ready at the waiting area.`,
    ]);
  },

  // 5. Appointment cancelled
  bookingCancelled({ hospitalName, doctorName, token, slot }) {
    return build([
      `[${HOSPITAL_TAG}] Booking Cancelled`,
      `Token: ${token} has been cancelled.`,
      `Dr. ${doctorName} | Slot: ${slot}`,
      `${hospitalName}. Rebook anytime via MediQueue.`,
    ]);
  },

};

module.exports = Templates;

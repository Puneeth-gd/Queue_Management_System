/* =====================================================
   Doctor Portal — JavaScript Logic
   ===================================================== */

const Doctor = {
  timer: 0,
  timerInterval: null,
  timerRunning: false,
  status: 'available',
  simInterval: null,
  walkInCount: 60,
};

// ─── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Doctor.init();
});

Doctor.init = function () {
  Doctor.renderQueue();
  Doctor.renderCurrentPatient();
  Doctor.renderDoctorStatus();
  Doctor.renderStats();
  Doctor.renderAlerts();
  Doctor.startSim();
};

// ─── Stats ────────────────────────────────────────────
Doctor.renderStats = function () {
  const total = App.doctorQueue.length;
  const waiting = App.doctorQueue.filter(p => p.status === 'waiting').length;
  const urgent = App.doctorQueue.filter(p => p.urgent).length;
  const done = App.doctorQueue.filter(p => p.status === 'done').length;

  setEl('stat-total', total);
  setEl('stat-waiting', waiting);
  setEl('stat-urgent', urgent);
  setEl('stat-done', done);
};

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─── Doctor Status ────────────────────────────────────
Doctor.renderDoctorStatus = function () {
  const statusMap = {
    available: { cls: 'doctor-status-available', dotCls: 'status-dot-green', label: '🟢 Available', dot: 'green' },
    busy: { cls: 'doctor-status-busy', dotCls: 'status-dot-blue', label: '🔵 In Consultation', dot: 'blue' },
    emergency: { cls: 'doctor-status-emergency', dotCls: 'status-dot-red', label: '🔴 Emergency', dot: 'red' },
    offline: { cls: 'doctor-status-offline', dotCls: 'status-dot-gray', label: '⚫ Offline', dot: 'gray' },
  };
  const s = statusMap[Doctor.status] || statusMap.available;

  const badge = document.getElementById('doctor-status-badge');
  const navDot = document.getElementById('nav-status-dot');
  if (badge) {
    badge.className = `doctor-status ${s.cls}`;
    badge.innerHTML = `<span class="status-dot status-dot-${s.dot}"></span>${s.label}`;
  }
  if (navDot) navDot.className = `status-dot status-dot-${s.dot}`;

  // Update visible to patients
  const visEl = document.getElementById('patient-visible-status');
  if (visEl) visEl.innerHTML = `<span class="badge ${Doctor.status === 'available' ? 'badge-green' : Doctor.status === 'emergency' ? 'badge-red' : 'badge-blue'}">${s.label}</span> <span class="text-micro text-muted">Visible to all patients</span>`;
};

window.setDoctorStatus = function (status) {
  Doctor.status = status;
  App.state.doctorStatus = status;
  Doctor.renderDoctorStatus();
  App.toast('Status Updated', `You are now marked as ${status}.`, 'info');
  closeModal('status-modal');
};

// ─── Queue Stepper ────────────────────────────────────
Doctor.renderQueue = function () {
  const container = document.getElementById('queue-stepper');
  if (!container) return;
  container.innerHTML = '';

  App.doctorQueue.forEach((patient, idx) => {
    const isCurrent = patient.status === 'in-consultation';
    const isDone = patient.status === 'done';
    const isUrgent = patient.urgent;
    const isLast = idx === App.doctorQueue.length - 1;

    let dotClass = 'stepper-dot';
    if (isCurrent) dotClass += ' current';
    else if (isUrgent) dotClass += ' urgent';
    else if (isDone) dotClass += ' done';

    const item = document.createElement('div');
    item.className = 'stepper-item animate-in';
    item.style.animationDelay = `${idx * 70}ms`;
    item.id = `queue-item-${patient.token}`;
    item.innerHTML = `
      <div class="stepper-left">
        <div class="${dotClass}" title="${patient.name}">
          ${isDone ? '✓' : patient.token.replace('T-', '')}
        </div>
        ${!isLast ? `<div class="stepper-line ${isCurrent ? 'style=background:linear-gradient(var(--blue-400),var(--border-glass));' : ''}"></div>` : ''}
      </div>
      <div class="stepper-content">
        <div class="flex flex-between" style="align-items:flex-start;">
          <div>
            <div class="stepper-name">${patient.name} ${isUrgent ? '<span class="badge badge-red" style="font-size:9px;padding:2px 6px;">URGENT</span>' : ''}</div>
            <div class="stepper-meta">${patient.token} · Age ${patient.age} · ${patient.arrived ? '✅ Arrived' : '⏳ Not arrived'}</div>
            <div class="stepper-meta" style="margin-top:3px;color:var(--text-secondary);font-size:11px;">${patient.complaint}</div>
          </div>
          <div class="flex gap-4" style="flex-shrink:0; flex-direction:column;">
            ${isCurrent
        ? `<span class="badge badge-blue" style="font-size:10px;">NOW</span>`
        : isDone
          ? `<span class="badge badge-green" style="font-size:10px;">DONE</span>`
          : `<button class="btn btn-warning btn-sm" style="padding:4px 8px;font-size:11px;" onclick="Doctor.moveToFront('${patient.token}')">Front</button>
                   <button class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:11px;margin-top:4px;" onclick="Doctor.skipPatient('${patient.token}')">Skip</button>`
      }
          </div>
        </div>
        ${isCurrent ? `
          <div style="margin-top:8px;">
            <div class="progress-bar-track"><div class="progress-bar-fill" style="width:45%;"></div></div>
          </div>` : ''}
      </div>
    `;
    container.appendChild(item);
  });
};

// ─── Current Patient Card ─────────────────────────────
Doctor.renderCurrentPatient = function () {
  const patient = App.doctorQueue.find(p => p.status === 'in-consultation');
  const card = document.getElementById('current-patient-card');
  if (!card || !patient) return;

  card.innerHTML = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:56px;margin-bottom:8px;">${patient.avatar}</div>
      <div style="font-size:56px;font-weight:900;font-family:'JetBrains Mono',monospace;background:var(--gradient-main);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;">${patient.token}</div>
      <div style="font-size:22px;font-weight:700;margin-top:8px;">${patient.name}</div>
      <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Age ${patient.age} · ${patient.complaint}</div>
      <div style="margin-top:12px;">
        <span class="badge badge-blue">In Consultation</span>
        ${patient.urgent ? '<span class="badge badge-red" style="margin-left:6px;">URGENT</span>' : ''}
      </div>
      
      <div id="ai-history-insight" style="margin-top:20px; display:none; text-align:left; padding:16px; background:rgba(123,104,238,0.1); border:1px solid rgba(123,104,238,0.3); border-radius:var(--radius-md);">
        <div class="text-micro" style="color:var(--indigo-200);margin-bottom:8px;display:flex;align-items:center;gap:6px;">✨ AI SMART INSIGHT</div>
        <div id="ai-insight-text" style="font-size:13px; line-height:1.5; color:var(--text-main);"></div>
      </div>
      
      <button class="btn btn-outline-purple btn-sm" id="ai-insight-btn" onclick="Doctor.generateInsight('${patient.token}')" style="margin-top:16px; border:1px solid var(--indigo-500); color:var(--indigo-200); background:transparent; width:auto; padding:8px 16px;">
        🔍 AI: Scan Medical History Pattern
      </button>
    </div>
    <div style="text-align:center;padding:20px 0;border-top:1px solid var(--border-glass);border-bottom:1px solid var(--border-glass);margin-bottom:20px;">
      <div class="text-micro text-muted" style="letter-spacing:1px;margin-bottom:6px;">CONSULTATION TIME</div>
      <div class="consultation-timer" id="consult-timer">00:00</div>
      <div class="live-indicator" style="justify-content:center;margin-top:6px;">
        <div class="live-dot"></div> LIVE
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <button class="btn btn-success btn-full" onclick="Doctor.completeConsultation()">
        ✅ Complete
      </button>
      <button class="btn btn-primary btn-full" onclick="Doctor.callNextPatient()">
        ⏭️ Call Next
      </button>
      <button class="btn btn-warning btn-full" onclick="Doctor.skipPatient('${patient.token}')">
        ⏩ Skip Patient
      </button>
      <button class="btn btn-danger btn-full" onclick="openModal('emergency-modal')">
        🚨 Emergency
      </button>
      <button class="btn btn-outline-blue btn-full" onclick="Doctor.askGemini()" id="doctor-gemini-btn" style="grid-column: span 2; background: rgba(99,179,237,0.05); border-color: rgba(99,179,237,0.5);">
        ✨ Ask AI for Triage Questions
      </button>
      <div id="ai-triage-result" style="grid-column: span 2; display:none; padding: 16px; background: rgba(99,179,237,0.1); border: 1px solid rgba(99,179,237,0.3); border-radius: var(--radius-md); font-size:13px; color: var(--blue-100); text-align: left; line-height: 1.5;"></div>
    </div>
  `;

  Doctor.startTimer();
};

// ─── Consultation Timer ───────────────────────────────
Doctor.startTimer = function () {
  if (Doctor.timerInterval) clearInterval(Doctor.timerInterval);
  Doctor.timer = 0;
  Doctor.timerRunning = true;
  Doctor.timerInterval = setInterval(() => {
    if (!Doctor.timerRunning) return;
    Doctor.timer++;
    const el = document.getElementById('consult-timer');
    if (el) el.textContent = App.formatTimer(Doctor.timer);
  }, 1000);
};

Doctor.stopTimer = function () {
  Doctor.timerRunning = false;
  if (Doctor.timerInterval) clearInterval(Doctor.timerInterval);
};

// ─── Actions ──────────────────────────────────────────
window.startConsultation = function () {
  const next = App.doctorQueue.find(p => p.status === 'waiting');
  if (!next) { App.toast('Queue Empty', 'No patients in queue.', 'info'); return; }
  next.status = 'in-consultation';
  Doctor.status = 'busy';
  Doctor.renderDoctorStatus();
  Doctor.renderQueue();
  Doctor.renderCurrentPatient();
  Doctor.renderStats();
  App.toast('Consultation Started', `Now seeing ${next.name}`, 'success');
};

Doctor.completeConsultation = function () {
  const cur = App.doctorQueue.find(p => p.status === 'in-consultation');
  if (!cur) return;
  cur.status = 'done';
  Doctor.stopTimer();
  Doctor.status = 'available';
  Doctor.renderDoctorStatus();
  Doctor.renderQueue();
  Doctor.renderStats();

  // Clear current patient card
  const card = document.getElementById('current-patient-card');
  if (card) {
    card.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
        <div style="font-size:48px;margin-bottom:12px;">✅</div>
        <div class="text-lg font-bold text-primary">Consultation Complete</div>
        <div class="text-sm" style="margin-top:6px;">Click <strong>Call Next</strong> to start next patient</div>
        <button class="btn btn-primary btn-lg" style="margin-top:20px;" onclick="Doctor.callNextPatient()">
          ⏭️ Call Next Patient
        </button>
      </div>
    `;
  }

  App.toast('Complete', `${cur.name} consultation finished in ${App.formatTimer(Doctor.timer)}`, 'success');
};

Doctor.callNextPatient = function () {
  const cur = App.doctorQueue.find(p => p.status === 'in-consultation');
  if (cur) cur.status = 'done';

  const next = App.doctorQueue.find(p => p.status === 'waiting' && p.arrived);
  if (!next) {
    App.toast('Queue', 'No arrived patients available.', 'warning');
    Doctor.renderQueue();
    Doctor.renderStats();
    return;
  }

  next.status = 'in-consultation';
  Doctor.status = 'busy';
  Doctor.renderDoctorStatus();
  Doctor.renderQueue();
  Doctor.renderCurrentPatient();
  Doctor.renderStats();
  App.toast('Next Patient', `Calling ${next.name} — ${next.token}`, 'info');
};

Doctor.skipPatient = function (token) {
  const patient = App.doctorQueue.find(p => p.token === token);
  if (!patient) return;
  patient.status = 'skipped';
  patient.arrived = false;
  Doctor.renderQueue();
  Doctor.renderStats();
  App.toast('Patient Skipped', `${patient.name} marked as skipped.`, 'warning');
};

Doctor.moveToFront = function (token) {
  const idx = App.doctorQueue.findIndex(p => p.token === token);
  if (idx === -1) return;
  const p = App.doctorQueue.splice(idx, 1)[0];
  p.urgent = true;

  // Find current in-consultation to insert after, or put at front if none
  const curIdx = App.doctorQueue.findIndex(p => p.status === 'in-consultation');
  if (curIdx >= 0) {
    App.doctorQueue.splice(curIdx + 1, 0, p);
  } else {
    App.doctorQueue.unshift(p);
  }

  Doctor.renderQueue();
  Doctor.renderStats();
  Doctor.renderAlerts();
  App.toast('Moved to Front', `${p.name} marked urgent and moved to front.`, 'warning');
};

// ─── Walk-In Patient ──────────────────────────────────
window.addWalkIn = function () {
  const name = document.getElementById('walkin-name')?.value.trim();
  const complaint = document.getElementById('walkin-complaint')?.value.trim();
  const urgent = document.getElementById('walkin-urgent')?.checked;

  if (!name) { App.toast('Error', 'Please enter patient name.', 'error'); return; }

  Doctor.walkInCount++;
  const newPatient = {
    token: `W-${Doctor.walkInCount}`,
    name: name,
    age: Math.floor(Math.random() * 50) + 20,
    status: 'waiting',
    urgent: urgent || false,
    arrived: true,
    complaint: complaint || 'Walk-in patient',
    avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
  };

  if (urgent) {
    // Insert after current patient
    const curIdx = App.doctorQueue.findIndex(p => p.status === 'in-consultation');
    App.doctorQueue.splice(curIdx + 1, 0, newPatient);
  } else {
    App.doctorQueue.push(newPatient);
  }

  Doctor.renderQueue();
  Doctor.renderStats();
  closeModal('walkin-modal');
  App.toast('Walk-in Added', `${name} — Token ${newPatient.token}${urgent ? ' (URGENT – moved to top)' : ''}`, urgent ? 'error' : 'success');
};

// ─── Emergency ────────────────────────────────────────
window.triggerEmergency = function () {
  App.state.emergencyActive = true;
  App.state.queuePaused = true;
  Doctor.status = 'emergency';
  App.emergencyAlert = {
    msg: '🚨 Dr. Meera Sharma — Emergency surgery in progress. Queue temporarily paused.',
    time: new Date(),
  };

  // Add emergency patient to top
  const emergencyPatient = {
    token: 'EMRG',
    name: 'Emergency Patient',
    age: '—',
    status: 'in-consultation',
    urgent: true,
    arrived: true,
    complaint: '⚠️ Critical emergency — immediate attention required',
    avatar: '🚨',
  };
  App.doctorQueue.unshift(emergencyPatient);

  Doctor.renderDoctorStatus();
  Doctor.renderQueue();
  Doctor.renderAlerts();
  Doctor.renderStats();
  Doctor.renderCurrentPatient();
  closeModal('emergency-modal');

  App.toast('🚨 Emergency Mode', 'Queue paused. All patients notified.', 'error', 0);
};

window.resolveEmergency = function () {
  App.state.emergencyActive = false;
  App.state.queuePaused = false;
  App.emergencyAlert = null;
  Doctor.status = 'available';

  // Remove emergency patient
  App.doctorQueue = App.doctorQueue.filter(p => p.token !== 'EMRG');

  Doctor.renderDoctorStatus();
  Doctor.renderQueue();
  Doctor.renderAlerts();
  Doctor.renderStats();
  App.toast('Emergency Resolved', 'Queue resumed. Patients notified.', 'success');
};

// ─── Alerts panel ────────────────────────────────────
Doctor.renderAlerts = function () {
  const container = document.getElementById('alerts-panel');
  if (!container) return;
  container.innerHTML = '';

  if (App.state.emergencyActive) {
    const el = document.createElement('div');
    el.className = 'alert-banner alert-emergency';
    el.style.marginBottom = '10px';
    el.innerHTML = `
      <span style="font-size:20px;">🚨</span>
      <div style="flex:1;">
        <strong>Emergency Active</strong>
        <div style="font-size:11px;margin-top:2px;">${App.emergencyAlert?.msg || ''}</div>
      </div>
      <button class="btn btn-sm" style="background:rgba(245,101,101,0.2);color:var(--red-400);border:1px solid var(--red-500);flex-shrink:0;" onclick="resolveEmergency()">Resolve</button>
    `;
    container.appendChild(el);
  }

  const urgentPatients = App.doctorQueue.filter(p => p.urgent && p.status === 'waiting');
  urgentPatients.forEach(p => {
    const el = document.createElement('div');
    el.className = 'alert-banner alert-warning';
    el.style.marginBottom = '8px';
    el.innerHTML = `<span>⚠️</span> <div><strong>${p.token}</strong> — ${p.name} needs urgent attention</div>`;
    container.appendChild(el);
  });

  if (!App.state.emergencyActive && !urgentPatients.length) {
    container.innerHTML = `<div class="alert-banner alert-success"><span>✅</span> Queue running smoothly. No alerts.</div>`;
  }
};

// ─── Simulation ───────────────────────────────────────
Doctor.startSim = function () {
  Doctor.simInterval = App.startLiveSimulation((event) => {
    if (event === 'queue_update') {
      Doctor.renderStats();
    }
    if (event === 'emergency') {
      Doctor.renderAlerts();
    }
    if (event === 'emergency_resolved') {
      Doctor.renderAlerts();
    }
  });
};

/// ─── Gemini AI Triage Assist (SECURE BACKEND VERSION) ─────────
Doctor.askGemini = async function () {
  const patient = App.doctorQueue.find(p => p.status === 'in-consultation');
  if (!patient) {
    App.toast('No Patient', 'No active consultation found.', 'warning');
    return;
  }

  const btn = document.getElementById('doctor-gemini-btn');
  const resultDiv = document.getElementById('ai-triage-result');

  btn.innerText = '✨ AI is thinking...';
  btn.disabled = true;
  resultDiv.style.display = 'none';

  try {
    const response = await fetch('http://localhost:5000/api/ai/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: patient.name,
        age: patient.age,
        complaint: patient.complaint
      })
    });

    if (!response.ok) {
      throw new Error('Backend not responding');
    }

    const data = await response.json();

    resultDiv.innerHTML = `
      <strong>✨ AI Triage Suggestions:</strong><br/><br/>
      ${data.reply.replace(/\n/g, '<br/>')}
    `;
    resultDiv.style.display = 'block';

  } catch (err) {
    console.error(err);
    App.toast('AI Error', 'Could not fetch AI response.', 'error');
  } finally {
    btn.innerText = '✨ Ask AI for Triage Questions';
    btn.disabled = false;
  }
};

// ─── AI Patient History Pattern Recognition ──────────────────
Doctor.generateInsight = async function(token) {
  const history = App.patientHistories[token];
  const btn = document.getElementById('ai-insight-btn');
  const box = document.getElementById('ai-history-insight');
  const text = document.getElementById('ai-insight-text');

  if (!history || history.length === 0) {
    App.toast('No History', 'This is a new patient with no previous visit records.', 'info');
    return;
  }

  btn.disabled = true;
  btn.innerText = '🔍 AI Scanning History...';
  
  const historyStr = history.map(h => `${h.date}: ${h.note}`).join('\n');
  const cachedGeminiKey = 'AIzaSyANRe_3KT7kiDjBWGG3MWS8HVpscZav6n8';

  try {
    const prompt = `You are a Medical Research Assistant. Look at these previous doctor visit notes for a patient:
${historyStr}

Identify the top 1 MOST CRITICAL medical pattern or risk (e.g., progressive symptoms, recurring allergies, potential chronic issue). 
Respond in exactly 1 concise, professional sentence. Do NOT mention diagnosis. Start the sentence with a strong action word or warning.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cachedGeminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings: [{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }]
      })
    });

    const data = await response.json();
    const insight = data.candidates[0].content.parts[0].text.trim();

    text.innerText = insight;
    box.style.display = 'block';
    btn.style.display = 'none'; // Hide button after scan
  } catch (err) {
    console.error(err);
    App.toast('Insight Error', 'Could not access medical pattern analysis.', 'error');
  } finally {
    btn.innerText = '🔍 AI: Scan Medical History Pattern';
    btn.disabled = false;
  }
};
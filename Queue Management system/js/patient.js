/* =====================================================
   Patient Portal — JavaScript Logic (SMS integrated)
   ===================================================== */

const Patient = {
  booking: { hospital:null, department:null, doctor:null, slot:null, token:null, status:null, date:null, phone:null },
  bookings: [], // Array to store multiple tokens
  arrived: false,
  simInterval: null,
  almostNotified: false,
};

document.addEventListener('DOMContentLoaded', () => Patient.init());

Patient.init = function () {
  Patient.renderHospitals();
  Patient.renderQueueFlow();
  Patient.renderTokenCard();
  Patient.renderAlerts();
  App.generateQR('qr-code');
  Patient.startSim();
  Patient.bindTabs();
  Patient.bindSlots();

  // Sync SMS toggle with saved preference
  const tog = document.getElementById('sms-toggle');
  if (tog) { tog.checked = SMS.isSmsEnabled(); Patient.updateSmsBadge(tog.checked); }

  // Clear dummy booking for production
  Patient.booking = { hospital:null, department:null, doctor:null, slot:null, token:null, status:null, date:null, phone:null };
  Patient.bookings = [];
  Patient.renderTokenCard();
  Patient.renderQueueFlow();
};

// ─── SMS helpers ──────────────────────────────────────
Patient.onSmsToggle = function(on) {
  SMS.toggleSmsAlerts(on);
  Patient.updateSmsBadge(on);
  App.toast('SMS Alerts', on ? '📱 SMS notifications enabled' : '🔕 SMS notifications disabled', on ? 'success' : 'warning');
};
Patient.updateSmsBadge = function(on) {
  const b = document.getElementById('sms-global-status');
  if (!b) return;
  b.className = 'sms-status-badge ' + (on ? 'on' : 'off');
  b.textContent = on ? '● Enabled' : '○ Disabled';
};
Patient.onPhoneInput = function(input) {
  const v = input.value.replace(/\s+/g,'');
  input.classList.remove('phone-valid','phone-invalid');
  if (!v) { Patient.booking.phone=null; return; }
  const ok = SMS.isValidPhone(v);
  input.classList.add(ok ? 'phone-valid' : 'phone-invalid');
  Patient.booking.phone = ok ? v : null;
};
Patient.previewSms = function() {
  const box = document.getElementById('sms-preview-box');
  const cnt = document.getElementById('sms-char-count');
  if (!box) return;
  const b = Patient.booking;
  const msg = [
    '[MediQueue AI] Booking Confirmed!',
    'Hospital: '+(b.hospital?.name||'City General Hospital'),
    'Doctor: '+(b.doctor?.name||'Dr. Meera Sharma'),
    'Token: '+(b.token||'T-XXX')+' | Slot: '+(b.slot||'--:--'),
    'Est. Wait: ~25 mins (±10m)',
  ].join('\n').slice(0,160);
  box.style.display='block'; box.textContent=msg;
  if (cnt) { cnt.textContent=msg.length+'/160 chars'; cnt.style.color=msg.length>155?'var(--red-400)':'var(--text-muted)'; }
};

// ─── Tab Binding ─────────────────────────────────────
Patient.bindTabs = function() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.closest('.tab-nav').dataset.group;
      document.querySelectorAll(`.tab-btn[data-group="${g}"]`).forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`.tab-panel[data-group="${g}"]`).forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target)?.classList.add('active');
    });
  });
};

// ─── Hospital / Department / Doctor ───────────────────
Patient.renderHospitals = function() {
  const sel = document.getElementById('hospital-select'); if (!sel) return;
  App.hospitals.forEach(h => { const o=document.createElement('option'); o.value=h.id; o.textContent=h.name+' — '+h.address; sel.appendChild(o); });
  sel.addEventListener('change', () => { Patient.booking.hospital=App.hospitals.find(h=>h.id===sel.value)||null; Patient.renderDepartments(); });
};
Patient.renderDepartments = function() {
  const g = document.getElementById('dept-grid'); if (!g) return;
  g.innerHTML=''; g.style.display='grid';
  App.departments.forEach(d => {
    const c=document.createElement('div'); c.className='dept-card glass-card'; c.dataset.id=d.id;
    c.style.cssText='padding:16px 12px;text-align:center;cursor:pointer;transition:all .3s;';
    c.innerHTML=`<div style="font-size:28px;margin-bottom:6px;">${d.icon}</div><div style="font-size:12px;font-weight:700;">${d.name}</div>`;
    c.addEventListener('click', () => {
      document.querySelectorAll('.dept-card').forEach(x => x.style.borderColor='rgba(255,255,255,.1)');
      c.style.borderColor=d.color; c.style.boxShadow=`0 0 16px ${d.color}44`;
      Patient.booking.department=d; Patient.renderDoctors(d.id);
    });
    g.appendChild(c);
  });
};
Patient.renderDoctors = function(dId) {
  const ct = document.getElementById('doctor-list'); if (!ct) return;
  ct.innerHTML=''; ct.style.cssText='display:flex;flex-direction:column;gap:10px;';
  const docs = App.doctors.filter(d=>d.dept===dId);
  if (!docs.length) { ct.innerHTML='<p class="text-muted text-sm">No doctors available.</p>'; return; }
  docs.forEach(doc => {
    const sm={available:{cls:'badge-green',lbl:'Available'},busy:{cls:'badge-blue',lbl:'In Session'},emergency:{cls:'badge-red',lbl:'Emergency'}};
    const s=sm[doc.status]||sm.available;
    const c=document.createElement('div'); c.className='glass-card'; c.style.cssText=`padding:16px;cursor:${doc.status==='emergency'?'not-allowed':'pointer'};`;
    c.innerHTML=`<div class="flex flex-between">
      <div class="flex gap-12" style="align-items:center;">
        <div style="font-size:36px;">${doc.avatar}</div>
        <div>
          <div class="font-bold text-base text-primary">${doc.name}</div>
          <div class="text-sm text-muted">${doc.exp} · ${doc.fee}/visit</div>
          <div style="margin-top:5px;display:flex;gap:6px;align-items:center;"><span class="badge ${s.cls}">${s.lbl}</span><span class="text-micro text-muted">⭐ ${doc.rating}</span></div>
        </div>
      </div>
      ${doc.status!=='emergency'?`<button class="btn btn-outline-blue btn-sm" onclick="Patient.selectDoctor('${doc.id}')">Select</button>`:'<span class="text-micro text-red">Unavailable</span>'}
    </div>`;
    ct.appendChild(c);
  });
};

// ─── Gemini AI Recommender ─────────────────────────────────
let cachedGeminiKey = 'AIzaSyBIfetEZvbeAI1aK5UeJ9RHzscvTRWkW_4';

Patient.askGemini = async function() {
  const inputEl = document.getElementById('ai-symptoms-input');
  if (!inputEl) return;
  
  const input = inputEl.value.trim();
  if (!input) {
    App.toast('Input Required', 'Please describe your symptoms first.', 'warning');
    return;
  }
  
  const btn = document.getElementById('gemini-btn');
  const orgText = btn.innerText;
  btn.innerText = '✨ Analyzing symptoms...';
  btn.disabled = true;

  try {
    const validDepts = App.departments.map(d => d.name).join(', ');
    const promptText = `You are a medical routing AI. Your strictly ONLY job is to map a user symptom to a department. 
Input: "${input}"
Valid Departments: ${validDepts}, General Medicine, ENT.
Respond strictly in RAW JSON format with NO markdown wrapping, NO explanation, NO warnings. 
Format: {"department": "Name", "urgency": "High", "reason": "Short 1 sentence reason"}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cachedGeminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        safetySettings: [
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    if (!data.candidates || !data.candidates[0].content) {
       throw new Error("Gemini refused to answer (possible safety filter) or returned invalid data.");
    }

    let reply = data.candidates[0].content.parts[0].text.trim();
    reply = reply.replace(/^\`\`\`(json)?\n?/g, '').replace(/\`\`\`$/g, '').trim();
    
    // Attempt parsing JSON
    let parsed;
    try {
      parsed = JSON.parse(reply);
    } catch(e) {
      throw new Error("AI returned invalid JSON: " + reply.substring(0,40));
    }
    
    App.toast('Gemini Recommendation', `AI Suggests: ${parsed.department}\\nReason: ${parsed.reason}`, parsed.urgency === 'High' ? 'error' : 'info', 6000);
    
    // Fix: If no hospital selected, select the first one so department selection actually works!
    if (!Patient.booking.hospital) {
        document.getElementById('hospital-select').value = App.hospitals[0].id;
        Patient.booking.hospital = App.hospitals[0];
    }

    const matchedDept = App.departments.find(d => parsed.department.toLowerCase().includes(d.name.toLowerCase()));
    if (matchedDept) {
       // Only execute the click if it exists on screen
       const btnEl = document.querySelector(`.dept-btn[onclick="Patient.selectDept('${matchedDept.id}')"]`);
       if (btnEl) btnEl.click();
       else { Patient.booking.department = matchedDept; Patient.renderDoctors(); }
       
       inputEl.value = `[AI Auto-Selected ${parsed.department}] ` + input;
    }
  } catch (err) {
    console.error(err);
    App.toast('Error', 'Failed to reach Gemini: ' + err.message, 'error');
  } finally {
    btn.innerText = orgText;
    btn.disabled = false;
  }
};
Patient.selectDoctor = function(id) {
  const doc=App.doctors.find(d=>d.id===id); if (!doc) return;
  Patient.booking.doctor=doc; Patient.renderSlots();
  document.getElementById('slot-section')?.scrollIntoView({behavior:'smooth',block:'start'});
};

// ─── Slots ────────────────────────────────────────────
Patient.bindSlots = function(){};
Patient.renderSlots = function() {
  const sec=document.getElementById('slot-section'), g=document.getElementById('slots-grid');
  if (!sec||!g) return; sec.style.display='block';
  const slots=['09:00 AM','09:20 AM','09:40 AM','10:00 AM','10:20 AM','10:40 AM','11:00 AM','11:20 AM','02:00 PM','02:20 PM','02:40 PM','03:00 PM'];
  const booked=['09:00 AM','09:40 AM','10:20 AM'];
  g.innerHTML='';
  slots.forEach(sl => {
    const b=document.createElement('button'); b.className='slot-btn'+(booked.includes(sl)?' booked':''); b.textContent=sl; b.disabled=booked.includes(sl);
    if (!booked.includes(sl)) b.addEventListener('click', () => {
      document.querySelectorAll('.slot-btn').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected'); Patient.booking.slot=sl;
      document.getElementById('confirm-booking-btn').disabled=false;
      Patient.previewSms();
    });
    g.appendChild(b);
  });
  document.getElementById('confirm-booking-btn').disabled=true;
};

// ─── Confirm Booking + SMS ────────────────────────────
window.confirmBooking = async function() {
  if (!Patient.booking.slot) return;
  const phoneEl = document.getElementById('patient-phone');
  const phone = phoneEl?.value?.trim()||null;
  Patient.booking.phone = phone;
  Patient.booking.token = App.generateToken();
  Patient.booking.status = 'booked';
  Patient.booking.date = document.getElementById('booking-date')?.value || new Date().toISOString().split('T')[0];
  Patient.almostNotified = false;

  const newBooking = { ...Patient.booking };
  Patient.bookings.push(newBooking);

  App.queue.push({ token:newBooking.token, name:'You (New)', status:'waiting', waiting:App.queue.length*8, urgent:false, arrived:false, avatar:'YO', isPatient:true });
  Patient.renderTokenCard(); Patient.renderQueueFlow();
  document.querySelector('.tab-btn[data-target="tab-token"]')?.click();
  App.toast('Booking Confirmed!',`Token ${newBooking.token} — Dr. ${newBooking.doctor?.name||'Meera Sharma'}`,'success');
  closeModal('booking-modal');
  Patient.booking = { hospital:null, department:null, doctor:null, slot:null, token:null, status:null, date:null, phone:null };

  if (phone && SMS.isValidPhone(phone)) {
    App.toast('SMS','📤 Sending confirmation SMS…','info',2500);
    const b=Patient.booking;
    const r = await SMS.onBookingConfirmed({ phone, hospitalName:b.hospital?.name||'City General Hospital', doctorName:b.doctor?.name||'Dr. Meera Sharma', token:b.token, slot:b.slot, waitMins:App.queue.length*8 });
    if (r?.success) App.toast('SMS Sent ✅',`Confirmation sent to ${phone}`,'success');
    else if (!r?.skipped) App.toast('SMS Failed ⚠️','Could not send SMS. Is the backend running?','warning');
  }
};

// ─── Token Card ───────────────────────────────────────
Patient.renderTokenCard = function() {
  const container = document.getElementById('my-tokens-container'); 
  if (!container) return;
  container.innerHTML = '';
  
  const headerDetails = document.getElementById('patient-welcome-details');
  const headerBadge = document.getElementById('header-status-badge');
  
  if (Patient.bookings.length === 0) {
    if (headerDetails) headerDetails.innerText = 'No Active Bookings - Please book a slot';
    if (headerBadge) headerBadge.style.display = 'none';
    container.innerHTML = `<div class="glass-card-static p-24 text-center text-muted" style="margin-bottom:20px;">No active bookings. Book a slot to get a token.</div>`;
    return;
  }

  const firstActive = Patient.bookings.find(b => b.status === 'booked') || Patient.bookings[0];
  if (headerDetails) {
    headerDetails.innerText = `${firstActive.hospital?.name||'Hospital'} · Token ${firstActive.token} · ${firstActive.slot} slot`;
  }
  if (headerBadge) {
     headerBadge.style.display = 'inline-block';
     headerBadge.innerText = firstActive.status === 'booked' ? 'Active Booking' : firstActive.status.toUpperCase();
     headerBadge.className = 'badge ' + (firstActive.status === 'booked' ? 'badge-blue' : 'badge-slate');
  }

  const sm={booked:{cls:'badge-blue',lbl:'🎫 Booked'},cancelled:{cls:'badge-red',lbl:'❌ Cancelled'},completed:{cls:'badge-green',lbl:'✅ Completed'},skipped:{cls:'badge-orange',lbl:'⏭ Skipped'}};
  
  Patient.bookings.forEach(b => {
    const s = sm[b.status] || sm.booked;
    const card = document.createElement('div');
    card.className = 'token-card print-area';
    card.style.marginBottom = '20px';
    
    card.innerHTML = `
      <div id="token-card-content-${b.token}">
        <div class="flex flex-between" style="margin-bottom:20px;">
          <div>
            <div class="text-sm text-muted text-uppercase" style="letter-spacing:1px;margin-bottom:4px;">APPOINTMENT TOKEN</div>
            <div class="token-number">${b.token||'T-XXX'}</div>
          </div>
          <div style="text-align:right;"><div id="qr-code-${b.token}" class="qr-placeholder" style="margin-left:auto;"></div><div class="text-micro text-muted" style="margin-top:4px;">Scan at reception</div></div>
        </div>
        <div class="divider"></div>
        <div class="grid-2" style="gap:12px;margin-top:16px;">
          <div><div class="text-micro text-muted" style="margin-bottom:3px;">DOCTOR</div><div class="text-sm font-semibold">${b.doctor?.name||'Dr. Meera Sharma'}</div></div>
          <div><div class="text-micro text-muted" style="margin-bottom:3px;">DEPARTMENT</div><div class="text-sm font-semibold">${b.department?.name||'Cardiology'}</div></div>
          <div><div class="text-micro text-muted" style="margin-bottom:3px;">SLOT</div><div class="text-sm font-semibold">${b.slot||'10:30 AM'}</div></div>
          <div><div class="text-micro text-muted" style="margin-bottom:3px;">DATE</div><div class="text-sm font-semibold">${b.date||'Today, Apr 1'}</div></div>
          ${b.phone?`<div style="grid-column:span 2;"><div class="text-micro text-muted" style="margin-bottom:3px;">SMS ALERTS</div><div class="text-sm font-semibold">📱 ${b.phone}</div></div>`:''}
        </div>
        <div class="flex gap-8" style="margin-top:20px;flex-wrap:wrap;">
          <span class="badge ${s.cls}">${s.lbl}</span>
          <span class="badge badge-purple">${b.hospital?.name||'City General Hospital'}</span>
        </div>
        <div class="flex gap-8" style="margin-top:16px;">
          <button class="btn btn-ghost btn-sm" onclick="Patient.printToken('${b.token}')">🖨️ Print</button>
          <button class="btn btn-ghost btn-sm" onclick="Patient.shareToken('${b.token}')">📤 Share</button>
          ${b.status==='booked'?`<button class="btn btn-danger btn-sm" style="margin-left:auto;" onclick="Patient.cancelBooking('${b.token}')">Cancel Booking</button>`:''}
        </div>
      </div>
    `;
    container.appendChild(card);
    
    setTimeout(() => {
      const qrDiv = document.getElementById(`qr-code-${b.token}`);
      if (qrDiv && b.token) qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=MediQueue-Token-${b.token}" style="border-radius:8px;" alt="QR Code" />`;
    }, 50);
  });
};

Patient.printToken = function(tokenStr) {
  const b = Patient.bookings.find(x => x.token === tokenStr) || Patient.bookings[0];
  if (!b) return;

  const sm = {booked:{lbl:'🎫 Booked'}, cancelled:{lbl:'❌ Cancelled'}, completed:{lbl:'✅ Completed'}, skipped:{lbl:'⏭ Skipped'}};
  const s = sm[b.status] || sm.booked;
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MediQueue-Token-${b.token}`;

  const printWindow = window.open('', '_blank', 'width=600,height=700');
  if(!printWindow) { App.toast('Popup Blocked','Please allow popups to print.','warning'); return; }

  printWindow.document.write(`
    <html>
      <head>
        <title>Print Token - ${b.token}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .ticket { border: 2px dashed #ccc; padding: 30px; border-radius: 12px; max-width: 400px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
          .token { font-size: 42px; font-weight: 900; margin-top: 5px; color: #1a202c; }
          .qr { text-align: right; }
          .qr img { width: 120px; height: 120px; border: 1px solid #eee; padding: 5px; border-radius: 8px; }
          .divider { border-bottom: 1px solid #eee; margin: 20px 0; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .label { font-size: 11px; color: #718096; text-transform: uppercase; margin-bottom: 3px; }
          .value { font-size: 14px; font-weight: bold; color: #2d3748; }
          .footer { margin-top: 30px; display: flex; gap: 10px; font-size: 12px; font-weight: bold;}
          .badge { padding: 4px 10px; border-radius: 20px; background: #edf2f7; color: #4a5568; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <div>
              <div class="label">APPOINTMENT TOKEN</div>
              <div class="token">${b.token}</div>
            </div>
            <div class="qr">
              <img src="${qrUrl}" alt="QR" />
              <div class="label" style="text-align:center;margin-top:5px;">Scan at reception</div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="grid">
            <div><div class="label">Doctor</div><div class="value">${b.doctor?.name||'Dr. Meera Sharma'}</div></div>
            <div><div class="label">Department</div><div class="value">${b.department?.name||'Cardiology'}</div></div>
            <div><div class="label">Date</div><div class="value">${b.date||'Today'}</div></div>
            <div><div class="label">Slot</div><div class="value">${b.slot||'10:30 AM'}</div></div>
          </div>
          <div class="footer">
            <span class="badge">${s.lbl}</span>
            <span class="badge">${b.hospital?.name||'City General Hospital'}</span>
          </div>
        </div>
        <script>
          window.onload = function() { 
            setTimeout(() => { window.print(); window.close(); }, 500); 
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

Patient.shareToken = function(tokenStr) {
  const b = Patient.bookings.find(x => x.token === tokenStr) || Patient.bookings[0];
  if (navigator.share) navigator.share({title:'My Hospital Token',text:`Token: ${b.token} | Slot: ${b.slot}`});
  else App.toast('Share','Token copied to clipboard!','info');
};

// ─── Cancel + SMS ─────────────────────────────────────
let __tokenToCancel = null;
Patient.cancelBooking = function(tokenStr) { 
  __tokenToCancel = tokenStr;
  const pEl = document.getElementById('cancel-token-label');
  if (pEl) pEl.innerText = tokenStr;
  openModal('cancel-confirm-modal'); 
};
window.confirmCancel = async function() {
  const b = Patient.bookings.find(x => x.token === __tokenToCancel);
  if (b) b.status = 'cancelled';
  App.queue = App.queue.filter(p => p.token !== __tokenToCancel);
  
  Patient.renderTokenCard(); Patient.renderQueueFlow();
  closeModal('cancel-confirm-modal');
  App.toast('Booking Cancelled','Your slot has been released.','warning');
  if (b && b.phone && SMS.isValidPhone(b.phone))
    await SMS.onBookingCancelled({ phone:b.phone, hospitalName:b.hospital?.name||'City General Hospital', doctorName:b.doctor?.name||'Dr. Meera Sharma', token:b.token, slot:b.slot });
};

// ─── Queue Flow + "Almost Your Turn" SMS ─────────────
Patient.renderQueueFlow = function() {
  const flow=document.getElementById('queue-flow'), stats=document.getElementById('queue-stats'); if (!flow) return;
  const curTokens=Patient.bookings.filter(b=>b.status!=='cancelled').map(b=>b.token);
  const myIdx=App.queue.findIndex(p=>curTokens.includes(p.token) || p.isPatient);
  
  const ahead=myIdx<0?0:myIdx-1;
  const wait=myIdx<0?0:App.queue[myIdx]?.waiting||(ahead > 0 ? ahead*8 : 0);
  const cur=App.queue.find(p=>p.status==='in-consultation');

  // Almost-your-turn SMS (2 or fewer ahead)
  if (myIdx>=0 && ahead<=2 && ahead>=0 && !Patient.almostNotified) {
    Patient.almostNotified=true;
    App.toast('Almost Your Turn!',`⏰ ${ahead} patient(s) ahead — please be ready.`,'warning',6000);
    const b=Patient.bookings[0] || Patient.booking;
    if (b && b.phone && SMS && typeof SMS.isValidPhone==='function' && SMS.isValidPhone(b.phone)) {
      SMS.onAlmostYourTurn({ phone:b.phone, hospitalName:b.hospital?.name||'City General Hospital', doctorName:b.doctor?.name||'Dr. Meera Sharma', token:App.queue[myIdx].token, patientsAhead:ahead })
        .then(r=>{ if(r?.success) App.toast('SMS Sent ✅','Almost-your-turn alert sent!','success'); }).catch(e=>console.log(e));
    }
  }

  if (stats) stats.innerHTML=`
    <div class="stat-card"><div class="stat-value gradient-text">${ahead<0?0:ahead}</div><div class="stat-label">Patients Ahead</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--teal-400)">~${wait} min (±10m)</div><div class="stat-label">AI Wait Window</div></div>
    <div class="stat-card"><div class="stat-value" style="color:var(--orange-400)">${cur?.token||'T-044'}</div><div class="stat-label">Now Serving</div></div>`;

  const pFill=document.getElementById('queue-progress-fill');
  if (pFill) pFill.style.width=`${100-Math.round(myIdx>=0?(myIdx/(App.queue.length-1))*100:50)}%`;

  flow.innerHTML='';
  App.queue.slice(0,8).forEach((p,i) => {
    const isMe=p.isPatient, isCur=p.status==='in-consultation';
    const el=document.createElement('div'); el.className='queue-step animate-in'; el.style.animationDelay=`${i*60}ms`;
    el.innerHTML=`
      <div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
        <div class="queue-node${isMe?' active':''}${isCur?' completed':''}" title="${p.name}" style="${p.urgent?'border-color:var(--red-500);animation:urgentPulse 1.5s infinite;':''}">
          ${isMe?'👤':p.avatar}
        </div>
        <div style="font-size:9px;color:${isMe?'var(--blue-400)':'var(--text-muted)'};font-weight:${isMe?'700':'400'};white-space:nowrap;">${isMe?'YOU':p.token}</div>
      </div>
      ${i<Math.min(App.queue.length,8)-1?`<div class="queue-connector${isCur?' passed':''}"></div>`:''}`;
    flow.appendChild(el);
  });
  const docN=document.createElement('div'); docN.className='queue-step';
  docN.innerHTML=`<div class="queue-connector"></div><div style="display:flex;flex-direction:column;align-items:center;gap:5px;"><div class="queue-node doctor">👩‍⚕️</div><div style="font-size:9px;color:var(--teal-400);font-weight:700;">DOCTOR</div></div>`;
  flow.appendChild(docN);
};

// ─── Check In ─────────────────────────────────────────
window.checkIn = function() {
  Patient.arrived=true;
  const q=App.queue.find(p=>p.isPatient); if (q) q.arrived=true;
  const btn=document.getElementById('checkin-btn');
  if (btn) { btn.innerHTML='✅ Checked In — Arrival Confirmed'; btn.disabled=true; }
  const st=document.getElementById('checkin-status');
  if (st) st.innerHTML=`<div class="alert-banner alert-success" style="margin-top:12px;">✅ Arrival confirmed. Please wait in the lounge.<br><span style="font-size:11px;opacity:.8;">Arrival window: ±15 min from scheduled time</span></div>`;
  App.toast('Checked In!','Please proceed to the waiting lounge.','success');
};

// ─── Alerts ───────────────────────────────────────────
Patient.renderAlerts = function() {
  const c=document.getElementById('alerts-container'); if (!c) return; c.innerHTML='';
  if (App.state.emergencyActive && App.emergencyAlert) {
    const el=document.createElement('div'); el.className='alert-banner alert-emergency';
    el.innerHTML=`<span style="font-size:20px;">🚨</span><div><strong>Emergency Delay</strong><br><span style="font-size:12px;">${App.emergencyAlert.msg} — Wait times updated.</span></div>`;
    c.appendChild(el);
  }
  const info=document.createElement('div'); info.className='alert-banner alert-info';
  info.innerHTML=`<span>💡</span> <span>Your arrival window is <strong>±15 minutes</strong> from your slot.</span>`;
  c.appendChild(info);
};

// ─── Simulation + Emergency SMS ───────────────────────
Patient.startSim = function() {
  Patient.simInterval = App.startLiveSimulation(async (ev) => {
    if (ev==='queue_update') { Patient.renderQueueFlow(); Patient.renderTokenCard(); }
    if (ev==='emergency') {
      Patient.renderAlerts();
      App.toast('Emergency Alert','🚨 Doctor delayed — wait times updated','error',6000);
      const b=Patient.booking;
      if (b.phone && SMS.isValidPhone(b.phone))
        await SMS.onEmergencyDelay({ phone:b.phone, hospitalName:b.hospital?.name||'City General Hospital', doctorName:b.doctor?.name||'Dr. Meera Sharma', extraWaitMins:15 });
    }
    if (ev==='emergency_resolved') { Patient.renderAlerts(); App.toast('Queue Resumed','✅ Doctor is back. Queue continues.','success'); }
  });
};

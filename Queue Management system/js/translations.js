const translations = {
  en: {
    "login_patient": "Patient Login",
    "login_doctor": "Doctor Login",
    "login_admin": "Admin Login",
    "welcome_title": "Welcome to MediQueue AI",
    "welcome_sub": "Select your portal to login and continue.",
    "support_title": "Supported Hospitals & Contacts",
    "tab_queue": "Live Queue",
    "tab_book": "Book Slot",
    "tab_token": "My Tokens",
    "tab_checkin": "Check In",
    "step1_hosp": "Step 1 — Select Hospital",
    "step2_dept": "Step 2 — Select Department",
    "step3_doc": "Step 3 — Select Doctor",
    "step4_slot": "Step 4 — Choose Date & Time Slot",
    "pay_confirm": "Pay & Confirm Booking",
    "btn_back_home": "Back to Home Page"
  },
  hi: {
    "login_patient": "रोगी लॉगिन",
    "login_doctor": "डॉक्टर लॉगिन",
    "login_admin": "व्यवस्थापक लॉगिन",
    "welcome_title": "MediQueue AI में आपका स्वागत है",
    "welcome_sub": "लॉगिन करने और जारी रखने के लिए अपने पोर्टल का चयन करें।",
    "support_title": "समर्थित अस्पताल और संपर्क",
    "tab_queue": "लाइव कतार",
    "tab_book": "स्लॉट बुक करें",
    "tab_token": "मेरे टोकन",
    "tab_checkin": "चेक इन",
    "step1_hosp": "चरण 1 — अस्पताल चुनें",
    "step2_dept": "चरण 2 — विभाग चुनें",
    "step3_doc": "चरण 3 — डॉक्टर चुनें",
    "step4_slot": "चरण 4 — तिथि और समय स्लॉट चुनें",
    "pay_confirm": "भुगतान करें और बुकिंग की पुष्टि करें",
    "btn_back_home": "मुख पृष्ठ पर वापस जाएं"
  },
  kn: {
    "login_patient": "ರೋಗಿಯ ಲಾಗಿನ್",
    "login_doctor": "ವೈದ್ಯರ ಲಾಗಿನ್",
    "login_admin": "ನಿರ್ವಾಹಕ ಲಾಗಿನ್",
    "welcome_title": "MediQueue AI ಗೆ ಸುಸ್ವಾಗತ",
    "welcome_sub": "ಲಾಗಿನ್ ಮಾಡಲು ಮತ್ತು ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಪೋರ್ಟಲ್ ಆಯ್ಕೆಮಾಡಿ.",
    "support_title": "ಬೆಂಬಲಿತ ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ಸಂಪರ್ಕಗಳು",
    "tab_queue": "ಲೈವ್ ಕ್ಯೂ",
    "tab_book": "ಸ್ಲಾಟ್ ಕಾಯ್ದಿರಿಸಿ",
    "tab_token": "ನನ್ನ ಟೋಕನ್‌ಗಳು",
    "tab_checkin": "ಚೆಕ್-ಇನ್",
    "step1_hosp": "ಹಂತ 1 - ಆಸ್ಪತ್ರೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "step2_dept": "ಹಂತ 2 - ವಿಭಾಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "step3_doc": "ಹಂತ 3 - ವೈದ್ಯರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "step4_slot": "ಹಂತ 4 - ದಿನಾಂಕ ಮತ್ತು ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "pay_confirm": "ಪಾವತಿಸಿ ಮತ್ತು ಬುಕಿಂಗ್ ಖಚಿತಪಡಿಸಿ",
    "btn_back_home": "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ"
  },
  te: {
    "login_patient": "రోగి లాగిన్",
    "login_doctor": "డాక్టర్ లాగిన్",
    "login_admin": "అడ్మిన్ లాగిన్",
    "welcome_title": "MediQueue AI కి స్వాగతం",
    "welcome_sub": "లాగిన్ చేసి కొనసాగడానికి మీ పోర్టల్‌ని ఎంచుకోండి.",
    "support_title": "మద్దతు ఉన్న ఆసుపత్రులు & పరిచయాలు",
    "tab_queue": "లైవ్ క్యూ",
    "tab_book": "స్లాట్ బుక్ చేయండి",
    "tab_token": "నా టోకెన్లు",
    "tab_checkin": "చెక్-ఇన్",
    "step1_hosp": "దశ 1 - ఆసుపత్రిని ఎంచుకోండి",
    "step2_dept": "దశ 2 - విభాగాన్ని ఎంచుకోండి",
    "step3_doc": "దశ 3 - డాక్టర్‌ని ఎంచుకోండి",
    "step4_slot": "దశ 4 - తేదీ & సమయాన్ని ఎంచుకోండి",
    "pay_confirm": "చెల్లించి బుకింగ్‌ని నిర్ధారించండి",
    "btn_back_home": "హోమ్ పేజీకి తిరిగి వెళ్లండి"
  }
};

function applyTranslations(lang) {
  const dict = translations[lang] || translations['en'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      // If it's an input placeholder
      if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
        el.setAttribute('placeholder', dict[key]);
      } else {
        el.textContent = dict[key];
      }
    }
  });
}

// Global setLang for inline calling
window.setLang = function(lang) {
  // Update buttons
  document.querySelectorAll('.btn-lang').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.btn-lang[onclick="setLang('${lang}')"]`);
  if (btn) btn.classList.add('active');
  
  // Save pref
  localStorage.setItem('mediqueue_lang', lang);
  applyTranslations(lang);
  
  if(window.App && App.toast) {
    let langName = "English";
    if (lang === 'hi') langName = "Hindi";
    if (lang === 'kn') langName = "Kannada";
    if (lang === 'te') langName = "Telugu";
    App.toast('Language', `Switched to ${langName}`, 'info', 2000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('mediqueue_lang') || 'en';
  applyTranslations(savedLang);
  const btn = document.querySelector(`.btn-lang[onclick="setLang('${savedLang}')"]`);
  if (btn) {
    document.querySelectorAll('.btn-lang').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
});

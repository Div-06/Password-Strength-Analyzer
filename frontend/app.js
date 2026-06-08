// Backend API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const passwordInput = document.getElementById('password-input');
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');
const strengthText = document.getElementById('strength-text');
const scoreNumber = document.getElementById('score-number');
const meterFill = document.getElementById('meter-fill');
const hashValue = document.getElementById('hash-value');
const hashStatus = document.getElementById('hash-status');
const suggestionsContainer = document.getElementById('suggestions-container');
const saveBtn = document.getElementById('save-btn');
const toastContainer = document.getElementById('toast-container');

// Rules Elements
const rules = {
  length: document.getElementById('rule-length'),
  uppercase: document.getElementById('rule-uppercase'),
  lowercase: document.getElementById('rule-lowercase'),
  number: document.getElementById('rule-number'),
  special: document.getElementById('rule-special'),
  repeated: document.getElementById('rule-repeated'),
  common: document.getElementById('rule-common'),
  reuse: document.getElementById('rule-reuse')
};

// Debounce timer for keypress API calls
let debounceTimer;

// Eye SVGs for Show/Hide Password
const EYE_OPEN_PATH = `
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
`;
const EYE_CLOSED_PATH = `
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
  <line x1="1" y1="1" x2="23" y2="23"/>
`;

/* Event Listeners */
document.addEventListener('DOMContentLoaded', () => {
  // Password Input Listener
  passwordInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(performAnalysis, 150);
  });

  // Toggle Password Visibility
  togglePasswordBtn.addEventListener('click', togglePasswordVisibility);

  // Save Password Hash
  saveBtn.addEventListener('click', savePasswordHash);

  // Reset page to initial empty state
  resetUI();
});

/**
 * Toggle Password Input Visibility and Update Button Icon
 */
function togglePasswordVisibility() {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  eyeIcon.innerHTML = isPassword ? EYE_CLOSED_PATH : EYE_OPEN_PATH;
  togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
}

/**
 * Reset all UI components to default empty values
 */
function resetUI() {
  strengthText.innerText = 'Empty';
  strengthText.className = 'status-text text-very-weak';
  
  scoreNumber.innerText = '0';
  
  meterFill.style.width = '0%';
  meterFill.className = 'meter-fill bar-very-weak';
  
  hashValue.innerText = 'da39a3ee5e6b4b0d3255bfef95601890afd80709...'; // SHA-256 for empty string
  
  hashStatus.innerText = 'Not Generated';
  hashStatus.className = 'hash-status-badge';
  
  suggestionsContainer.innerHTML = '<p class="empty-suggestions">Enter a password to see dynamic suggestions.</p>';
  
  saveBtn.disabled = true;

  // Reset Checklist Items
  Object.keys(rules).forEach(key => {
    const item = rules[key];
    if (key === 'repeated' || key === 'common' || key === 'reuse') {
      setRuleStatus(item, true); // default pass for negative rules when empty
    } else {
      setRuleStatus(item, false);
    }
  });

  // Specifically reset the Reuse rule text to baseline
  rules.reuse.querySelector('.text').innerText = 'Not previously registered (Preventing Reuse)';
}

/**
 * Set requirement check row status in the checklist UI
 * @param {HTMLElement} element Checklist list item element
 * @param {boolean} isValid Whether check is passing
 * @param {string} [customText] Optional custom text to overwrite default
 */
function setRuleStatus(element, isValid, customText) {
  const icon = element.querySelector('.icon');
  const textSpan = element.querySelector('.text');
  
  if (customText) {
    textSpan.innerText = customText;
  }

  if (isValid) {
    element.className = 'check-item valid';
    icon.innerText = '✓';
  } else {
    element.className = 'check-item invalid';
    icon.innerText = '✗';
  }
}

/**
 * Core analysis trigger. Calls the backend API and processes the response.
 */
async function performAnalysis() {
  const password = passwordInput.value;
  
  if (!password) {
    resetUI();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      throw new Error('Analysis server error');
    }

    const data = await response.json();
    updateUI(data);

  } catch (error) {
    console.error('Fetch Error:', error);
    showToast('Failed to connect to backend server. Make sure the API is running.', 'error');
  }
}

/**
 * Updates all components of the UI using the response dataset
 * @param {object} data API Response dataset
 */
function updateUI(data) {
  const { score, level, checks, suggestions, hash, isReused } = data;

  // 1. Update Score and Strength Label
  scoreNumber.innerText = score;
  strengthText.innerText = level;
  
  // Clean old text classes and append new one
  const cleanLevelClass = level.toLowerCase().replace(' ', '-');
  strengthText.className = `status-text text-${cleanLevelClass}`;

  // 2. Update Strength Progress Bar
  meterFill.style.width = `${score}%`;
  meterFill.className = `meter-fill bar-${cleanLevelClass}`;

  // 3. Update Cryptographic Hash
  hashValue.innerText = hash;
  
  // 4. Update Database Uniqueness State
  if (isReused) {
    hashStatus.innerText = 'Reused / Blocked';
    hashStatus.className = 'hash-status-badge warning';
    
    // Add visual attention-grabbing shake
    hashStatus.classList.add('shake-animation');
    setTimeout(() => hashStatus.classList.remove('shake-animation'), 500);
    
    setRuleStatus(rules.reuse, false, 'Already registered (REUSE BLOCKED!)');
    saveBtn.disabled = true;
  } else {
    hashStatus.innerText = 'Unique / Safe';
    hashStatus.className = 'hash-status-badge verified';
    
    setRuleStatus(rules.reuse, true, 'Not previously registered (Safe to save)');
    // Enable save button if not empty
    saveBtn.disabled = false;
  }

  // 5. Update Checklist Statuses
  setRuleStatus(rules.length, checks.length);
  setRuleStatus(rules.uppercase, checks.uppercase);
  setRuleStatus(rules.lowercase, checks.lowercase);
  setRuleStatus(rules.number, checks.number);
  setRuleStatus(rules.special, checks.special);
  
  // Negated checks (no repeated patterns = checks.repeated is false)
  setRuleStatus(rules.repeated, !checks.repeated);
  // Negated checks (not common = checks.common is false)
  setRuleStatus(rules.common, !checks.common);

  // 6. Update Suggestions container
  suggestionsContainer.innerHTML = '';
  if (score >= 90 && !isReused) {
    suggestionsContainer.innerHTML = `
      <div class="success-suggestion-item">
        <span>✓ This is a highly secure password! Hash registration is recommended.</span>
      </div>
    `;
  } else if (suggestions.length === 0) {
    suggestionsContainer.innerHTML = `
      <div class="success-suggestion-item">
        <span>✓ Password meets complexity standards.</span>
      </div>
    `;
  } else {
    suggestions.forEach(tip => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.innerText = tip;
      suggestionsContainer.appendChild(div);
    });
  }
}

/**
 * Save current password's hash into database JSON file
 */
async function savePasswordHash() {
  const password = passwordInput.value;
  if (!password) return;

  saveBtn.disabled = true;
  passwordInput.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server failed to save hash');
    }

    showToast('Success: Password hash committed to database! Future reuse is blocked.', 'success');
    
    // Instantly refresh current password status (it will now show isReused: true)
    await performAnalysis();

  } catch (error) {
    console.error('Save error:', error);
    showToast(`Error: ${error.message}`, 'error');
    saveBtn.disabled = false;
  } finally {
    passwordInput.disabled = false;
    passwordInput.focus();
  }
}

/**
 * Display a premium floating Toast alert
 * @param {string} message Message text
 * @param {'success' | 'error'} type Type of notification
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.innerText = type === 'success' ? '✓' : '⚠';
  
  const msgSpan = document.createElement('span');
  msgSpan.className = 'toast-message';
  msgSpan.innerText = message;

  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);
  
  toastContainer.appendChild(toast);

  // Auto remove toast after 4.5 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4500);
}

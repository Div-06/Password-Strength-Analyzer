const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());

// List of 100 common passwords for checking
const COMMON_PASSWORDS = [
  '123456', 'password', '123456789', '12345678', '12345', 'qwerty', '1234567', 
  'google', 'dlink', '1234567890', '1234', '111111', 'letmein', 'password123', 
  'welcome', '123123', 'admin', 'computer', 'login', 'security', 'football', 
  'monkey', 'keyboard', 'pass123', 'shadow', 'superman', 'baseball', 'princess', 
  'charlie', 'joshua', 'ginger', 'hunter', 'killer', 'soccer', 'mustang', 'daniel', 
  'autumn', 'cookie', 'fluffy', 'andrew', 'thomas', 'butter', 'shadow', 'chester', 
  'jessica', 'michael', 'jennifer', 'orange', 'yellow', 'purple', 'flower', 'batman', 
  'whiskey', 'monkey1', 'bessie', 'harley', 'bailey', 'maggie', 'buddy', 'oliver', 
  'samson', 'charlotte', 'family', 'dragon', 'freedom', 'trust', 'honest', 'secret', 
  'justice', 'victory', 'champion', 'pioneer', 'america', 'london', 'tokyo', 'sydney', 
  'newyork', 'chicago', 'boston', 'seattle', 'denver', 'dallas', 'houston', 'miami', 
  'sunshine', 'beautiful', 'wonderful', 'loveyou', 'forever', 'together', 'believe', 
  'perfect', 'awesome', 'creative', 'imagine', 'explore', 'discover', 'journey'
];

/**
 * Hash a password using SHA-256.
 * @param {string} text Plain text password
 * @returns {string} SHA-256 hash in hex format
 */
function getSHA256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Load hashes from the JSON database.
 * @returns {string[]} Array of password hashes
 */
function loadHashes() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading database:', err);
    return [];
  }
}

/**
 * Save hashes array to the JSON database.
 * @param {string[]} hashes Array of hashes to save
 */
function saveHashes(hashes) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(hashes, null, 2));
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

/**
 * Analyze password complexity, score it, and provide suggestions.
 * @param {string} password The plain text password
 * @returns {object} Analysis results
 */
function analyzePassword(password) {
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      level: 'Very Weak',
      checks: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        repeated: false,
        common: false
      },
      suggestions: ['Password cannot be empty.']
    };
  }

  // Individual Checks
  const checks = {
    length: password.length >= 8,
    lengthOptimum: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    // Check for 3+ identical consecutive chars (e.g., "aaa") or repeating blocks of 2+ chars (e.g., "abcabc")
    repeated: /(.)\1{2,}/.test(password) || /(..+)\1/.test(password),
    common: COMMON_PASSWORDS.includes(password.toLowerCase())
  };

  // Base Scoring System
  let score = 0;

  // Length calculation (up to 30 points)
  // 2 points per character, capped at 20 points
  const baseLengthPoints = Math.min(20, password.length * 2);
  score += baseLengthPoints;
  // +10 bonus points for 12+ characters
  if (checks.lengthOptimum) {
    score += 10;
  }

  // Character variety points
  if (checks.uppercase) score += 15;
  if (checks.lowercase) score += 15;
  if (checks.number) score += 15;
  if (checks.special) score += 20;

  // Deductions
  if (checks.repeated) {
    score -= 15; // Deduct for lazy repeated patterns
  }

  // Strict check: if common password, set score to 0
  if (checks.common) {
    score = 0;
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine Level
  let level = 'Very Weak';
  if (score > 80) {
    level = 'Very Strong';
  } else if (score > 60) {
    level = 'Strong';
  } else if (score > 40) {
    level = 'Medium';
  } else if (score > 20) {
    level = 'Weak';
  }

  // Collect Suggestions
  const suggestions = [];
  if (checks.common) {
    suggestions.push('This password is very common. Choose a unique, unpredictable passphrase.');
  } else {
    if (password.length < 12) {
      suggestions.push('Increase the password length to 12 or more characters.');
    } else if (password.length < 8) {
      suggestions.push('Password must be at least 8 characters long.');
    }
    if (!checks.uppercase) {
      suggestions.push('Add at least one uppercase letter (A-Z).');
    }
    if (!checks.lowercase) {
      suggestions.push('Add at least one lowercase letter (a-z).');
    }
    if (!checks.number) {
      suggestions.push('Include one or more numeric digits (0-9).');
    }
    if (!checks.special) {
      suggestions.push('Use special characters (e.g., !, @, #, $, %, ^, &, *).');
    }
    if (checks.repeated) {
      suggestions.push('Avoid repeating character sequences (e.g., "123123", "aaaa").');
    }
  }

  return {
    score,
    level,
    checks,
    suggestions
  };
}

// Routes

// 1. Password analysis and database uniqueness check
app.post('/api/analyze', (req, res) => {
  const { password } = req.body;
  if (password === undefined) {
    return res.status(400).json({ error: 'Password field is required.' });
  }

  const analysis = analyzePassword(password);
  
  // Calculate SHA-256 hash and check uniqueness
  const hash = getSHA256(password);
  const storedHashes = loadHashes();
  const isReused = storedHashes.includes(hash);

  res.json({
    ...analysis,
    hash,
    isReused
  });
});

// 2. Save hashed password to prevent future reuse
app.post('/api/save', (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Valid password is required.' });
  }

  const hash = getSHA256(password);
  const storedHashes = loadHashes();

  if (storedHashes.includes(hash)) {
    return res.status(400).json({ 
      error: 'This password has already been registered and cannot be reused.' 
    });
  }

  // Store the hash (never store plain-text)
  storedHashes.push(hash);
  saveHashes(storedHashes);

  res.json({ 
    success: true, 
    message: 'Password hash saved successfully. Reuse will be blocked.',
    hash 
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

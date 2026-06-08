# ShieldPass: Advanced Password Strength Analyzer

ShieldPass is a premium, full-stack password strength and reuse analyzer. It features a modern, responsive glassmorphism dark-mode UI on the frontend, powered by a secure Node.js + Express backend that analyzes passwords in real-time, calculates strength scores, generates suggestions, and uses one-way SHA-256 cryptographic hashing to store passwords and prevent reuse without compromising plain-text security.

---

## Project Structure

```
password-strength-analyzer/
├── frontend/
│   ├── index.html     # Semantic UI layout
│   ├── style.css      # Premium dark glassmorphism theme and animations
│   └── app.js         # Debounced API fetch and reactive DOM updates
├── backend/
│   ├── server.js      # Node.js + Express server hosting strength & storage APIs
│   ├── database.json  # Storage for SHA-256 hashed passwords
│   └── package.json   # Node dependencies and scripts
└── README.md          # Project documentation (this file)
```

---

## How It Works

### 1. Password Scoring Algorithm
The backend calculates a strength score out of **100** points based on the following criteria:

- **Length Points (Up to 30 points)**:
  - Base score: `2` points per character, capped at a maximum of `20` points.
  - Bonus score: An additional `+10` points is awarded if the password length is `12` or more characters.
- **Character Diversity (Up to 70 points)**:
  - **Uppercase Letters (`A-Z`)**: `+15` points.
  - **Lowercase Letters (`a-z`)**: `+15` points.
  - **Numeric Digits (`0-9`)**: `+15` points.
  - **Special Characters (`!, @, #, $, %, etc.`)**: `+20` points.
- **Pattern Deductions**:
  - **Repeated Character Sequences**: Searches for 3+ consecutive identical characters (e.g. `aaa`) or repeating blocks of 2 or more characters (e.g. `123123`, `abcabc`). If detected, **`15` points are deducted**.
- **Common Passwords Check**:
  - Checks if the input matches a database of 100 most common passwords (e.g., `password`, `123456789`). If a match is found, **the final score is immediately set to `0`**.

#### Strength Scale
- **`0 - 20`**: Very Weak (Red progress bar)
- **`21 - 40`**: Weak (Orange progress bar)
- **`41 - 60`**: Medium (Yellow progress bar)
- **`61 - 80`**: Strong (Light Green progress bar)
- **`81 - 100`**: Very Strong (Vibrant Green progress bar)

---

### 2. Cryptographic Hashing & Uniqueness
To protect passwords from database breaches, **plain-text passwords are never saved**.

1. When a user inputs a password, the frontend makes an API call to `/api/analyze`.
2. The server analyzes the password and computes its **SHA-256 hash** using Node's native `crypto` module.
3. The server compares this hash against the list of hashes stored in `database.json`.
4. If a match is found, the server alerts the user that this password is a duplicate (`isReused = true`) and prevents saving it again.
5. If the user clicks **Register Hash in Database**, the server appends the SHA-256 hash to `database.json`. The plain-text password is discarded from memory immediately after computation.

---

## Local Setup & Run Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (version 16 or newer recommended).

### Step 1: Run the Backend Server
1. Open a terminal (PowerShell, Command Prompt, or bash) and navigate to the `backend` folder:
   ```bash
   cd C:/Users/divya/OneDrive/Desktop/password-strength-analyzer/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server in hot-reload watch mode (restarts automatically if code changes):
   ```bash
   npm run dev
   ```
   *The server will run on [http://localhost:5000](http://localhost:5000).*

---

### Step 2: Run the Frontend Application
Since the frontend is built using Vanilla HTML, CSS, and JS, you can run it in multiple ways:

#### Option A: Run via a local server (Recommended for development)
1. Open another terminal and install/run a simple static server (like `serve` or `http-server`):
   ```bash
   npx serve C:/Users/divya/OneDrive/Desktop/password-strength-analyzer/frontend
   ```
2. Open the URL shown in your terminal (usually [http://localhost:3000](http://localhost:3000) or [http://localhost:5000](http://localhost:5000)).

#### Option B: Direct File Open
1. Simply double-click the `index.html` file located in the `frontend` folder to open it directly in Google Chrome, Microsoft Edge, or Firefox.
2. Note: For full functionality, ensure the backend is running on `http://localhost:5000` to allow the API fetch queries to succeed.

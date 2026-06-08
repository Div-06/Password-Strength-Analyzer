# ShieldPass: Advanced Password Strength Analyzer

ShieldPass is a full-stack password strength and reuse analyzer. It features a responsive dark-mode frontend powered by a Node.js + Express backend that analyzes passwords in real time, calculates strength scores, generates suggestions, and uses SHA-256 hashing to store password fingerprints for reuse checks.

---

## Project Structure

```text
Password-Strength-Analyzer/
|-- frontend/
|   |-- index.html     # Semantic UI layout
|   |-- style.css      # Dark theme, responsive layout, and animations
|   `-- app.js         # API calls and reactive DOM updates
|-- backend/
|   |-- server.js      # Express server for strength and storage APIs
|   |-- database.json  # Storage for SHA-256 password hashes
|   `-- package.json   # Node dependencies and scripts
`-- README.md          # Project documentation
```

---

## How It Works

### 1. Password Scoring Algorithm

The backend calculates a strength score out of **100** points based on the following criteria:

- **Length Points (Up to 30 points)**:
  - Base score: `2` points per character, capped at a maximum of `20` points.
  - Bonus score: an additional `+10` points is awarded if the password length is `12` or more characters.
- **Character Diversity (Up to 70 points)**:
  - **Uppercase Letters (`A-Z`)**: `+15` points.
  - **Lowercase Letters (`a-z`)**: `+15` points.
  - **Numeric Digits (`0-9`)**: `+15` points.
  - **Special Characters (`!, @, #, $, %, etc.`)**: `+20` points.
- **Pattern Deductions**:
  - Repeated character sequences, such as `aaa`, `123123`, or `abcabc`, deduct `15` points.
- **Common Passwords Check**:
  - If the input matches a common password such as `password` or `123456789`, the final score is immediately set to `0`.

#### Strength Scale

- **`0 - 20`**: Very Weak
- **`21 - 40`**: Weak
- **`41 - 60`**: Medium
- **`61 - 80`**: Strong
- **`81 - 100`**: Very Strong

---

### 2. Cryptographic Hashing & Uniqueness

Plain-text passwords are not saved in `database.json`.

1. The frontend sends the entered password to the backend API for analysis.
2. The backend computes a SHA-256 hash using Node's native `crypto` module.
3. The backend compares this hash against the list of hashes stored in `database.json`.
4. If a match is found, the response marks the password as reused with `isReused = true`.
5. If the user clicks **Register Hash in Database**, only the SHA-256 hash is appended to `database.json`.

> Note: SHA-256 is used here for learning and demonstration. Production password storage should use a dedicated password hashing algorithm such as bcrypt, scrypt, or Argon2 with salts.

---

## Local Setup & Run Instructions

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed. Version 16 or newer is recommended.

### Step 1: Clone the Repository

```bash
git clone https://github.com/Div-06/Password-Strength-Analyzer.git
cd Password-Strength-Analyzer
```

### Step 2: Run the Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend will run on [http://localhost:5000](http://localhost:5000).

### Step 3: Run the Frontend Application

Open another terminal from the project root and run:

```bash
npx serve frontend
```

Open the URL shown in your terminal, usually [http://localhost:3000](http://localhost:3000).

### Alternative Frontend Option

You can also open `frontend/index.html` directly in your browser. For full functionality, keep the backend running on [http://localhost:5000](http://localhost:5000).

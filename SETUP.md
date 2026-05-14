# Parl — Setup & Run Guide

Step-by-step instructions to clone, install, and run the project on a fresh machine. **No prior project setup required.**

---

## What you'll end up with

- **Backend** running on `http://localhost:7071` (Azure Functions API)
- **Frontend** running on `http://localhost:5173` (the website)
- **Open this URL in your browser:** **http://localhost:5173**

The frontend proxies all `/api/*` calls to the backend automatically — you only need to open `localhost:5173`.

---

## 0. Prerequisites — install once

You'll need **3 tools** installed system-wide before starting:

### 1. Node.js (v20 or newer)
- Download from <https://nodejs.org/> (LTS version).
- After install, verify in a terminal:
  ```bash
  node --version
  npm --version
  ```
  Both should print version numbers.

### 2. Azure Functions Core Tools (v4)
This is what runs the backend functions locally.

- **macOS** (with Homebrew):
  ```bash
  brew tap azure/functions
  brew install azure-functions-core-tools@4
  ```
- **Windows** (with npm — easiest):
  ```bash
  npm install -g azure-functions-core-tools@4 --unsafe-perm true
  ```
- **Linux**: see <https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local>

Verify:
```bash
func --version
```
Should print `4.x.x`.

### 3. Git
- Most systems have it. If not, install from <https://git-scm.com/>.

---

## 1. Clone the repo

```bash
git clone <REPO_URL>
cd 491-ParlAI
```

Replace `<REPO_URL>` with the GitHub URL the team provided.

---

## 2. Configure the backend secrets

The backend needs database credentials. These are **not** committed to git for security.

1. Copy the example file:
   ```bash
   cp backend/local.settings.example.json backend/local.settings.json
   ```
   On Windows PowerShell: `copy backend\local.settings.example.json backend\local.settings.json`

2. Open `backend/local.settings.json` in any text editor and replace the `<copy from SETUP.md>` placeholders with these values:

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "DB_SERVER": "parlai-new.database.windows.net",
       "DB_NAME": "free-sql-db-5521983",
       "DB_USER": "CloudSAc3ceb5b1",
       "DB_PASSWORD": "Parlai123$",
       "SOCCER_ODDS_API": "optional-odds-api-key",
       "ODDS_API_KEY": "optional-odds-api-key",
       "JWT_SECRET": "any-random-string-for-local-dev"
     }
   }
   ```

   Save the file.

> The database is hosted on Azure SQL and shared across all team members + the grader. No local database setup is required.

---

## 3. Install dependencies

You'll need to install dependencies in **two** folders. Run these one at a time.

### Backend dependencies
```bash
cd backend
npm install
cd ..
```

### Frontend dependencies
```bash
cd frontend
npm install
cd ..
```

Each `npm install` takes ~30–60 seconds depending on your connection. You'll see a lot of output; warnings are fine as long as there's no `ERR!` line at the bottom.

---

## 4. Run the project (two terminals)

You'll need **two terminal windows** open at the same time.

### Terminal 1 — Backend (Azure Functions)
```bash
cd backend
npm start
```

Wait until you see output like:
```
Functions:

	auth: [POST] http://localhost:7071/api/auth/...
	getGames: [GET] http://localhost:7071/api/getGames
	place-bet: [POST] http://localhost:7071/api/bets/place
	...
	(many more lines)

For detailed output, run func with --verbose flag.
```

**Leave this terminal running.** The backend is now up on port 7071.

> If you get an error about port 10000 (Azurite), you may already have Azurite running from VS Code. That's fine — the backend will use the existing one.

### Terminal 2 — Frontend (React + Vite)
Open a **new** terminal window and run:

```bash
cd frontend
npm run dev
```

You'll see:
```
  VITE v7.3.2  ready in 130 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Leave this terminal running.**

---

## 5. Open the app in a browser

Go to: **<http://localhost:5173>**

The Parl home page should load with the sport selection grid.

---

## 6. Verify it works (30-second smoke test)

1. **Home page** loads — sport tiles visible (NBA, MLB, NHL, Soccer)
2. **Click NBA** — should see a list of games with real teams (Lakers, Celtics, etc.), real scores for finished games, and odds
3. **Click a Moneyline button** — bet slip should slide up from the bottom of the screen
4. **Click "Sign in"** (top-right or sidebar) — login page should load
5. **Create an account** with any email + password → redirects back to the app with $1000 starting balance

If all five work, you're good for the demo.

---

## Troubleshooting

### Backend errors

**`func: command not found`**
Azure Functions Core Tools wasn't installed or isn't in your PATH. Reinstall (see Prerequisites § 2) and restart your terminal.

**Backend errors about the database** (`Connection failed`, `Login failed`, etc.)
- Check that `backend/local.settings.json` has the exact values from step 2.
- The Azure SQL server has IP firewall rules — if you're on a corporate / school network, you may be blocked. Try a different network (phone hotspot works) or contact the team to add your IP to the allowlist.

**Port 7071 already in use**
Another `func` process is running. Find and kill it:
- macOS/Linux: `lsof -i :7071` then `kill <pid>`
- Windows: `netstat -ano | findstr :7071` then `taskkill /PID <pid> /F`

### Frontend errors

**Browser shows white screen / errors in console**
- Make sure the backend (terminal 1) is still running — the frontend needs it.
- Hard-refresh the page (Cmd+Shift+R / Ctrl+Shift+R).

**`/api/...` calls return 404 or fail**
The Vite proxy needs port 7071 active. Check terminal 1 is still showing the backend is up.

**Port 5173 already in use**
Vite will automatically pick the next free port (5174, 5175, etc.). Look at the terminal output — the URL after `Local:` is the one to open.

### General

**The app loads but no games appear**
The frontend pulls games from ESPN's public API. If your network blocks `site.api.espn.com`, games won't show. Test by visiting <https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard> in the browser — should return JSON.

---

## Stopping the project

In each terminal, press **Ctrl+C** to stop the process.

---

## Tech stack (for reference)

| Layer | Tech |
|---|---|
| Frontend | React 19 + Vite 7 + Tailwind CSS |
| Backend | Azure Functions v4 (Node.js) |
| Database | Azure SQL |
| Auth | JWT (email/password) |
| Live data | ESPN public API + The Odds API |
| Deploy target | Azure Static Web Apps |

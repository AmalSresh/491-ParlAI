Step 1: Clone Repo 
	- git clone --branch sprint4-group6-demo --single-branch git@github.com:AmalSresh/491-ParlAI.git

Step 2: Install npm
	- cd backend && npm install
	- cd ../frontend && npm install

Step 3: Change local.settings.json
	- cp backend/local.settings.example.json backend/local.settings.json
	- Change file so that it matches:
	
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
  
- Save and close
 
Step 4: Verify Azure Functions Core Tools in installed
- Run: 'func --version'
- if it prints 4.x.x -> skip to step 3.

- If you get "command not found", install it first:
- macOS: brew tap azure/functions && brew install azure-functions-core-tools@4
- Windows: npm install -g azure-functions-core-tools@4 --unsafe-perm true

Step 5: Start Backend (Terminal 1):
- cd backend
- npm start
- Wait until you see a big list of functions ending with auto-login, getGames, place-bets, etc. Leave this terminal running.

Step 6: Start Frontend (Terminal 2):
- cd frontend
- npm run dev

- You will see: 'http://localhost:51731/'

Step 6: Open the app:
- Go to http://localhost:51731 in your browser.
- Happy betting!

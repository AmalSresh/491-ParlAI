# 491-ParlAI

ParlAI is a full-stack sports betting web-app that uses vitual currency and is hosted through Microsoft Azure.

## Frontend

React  
 React-router  
 Vite

## Backend

Microsoft Azure  
 Azure Static Web Apps  
 Microsoft Entra ID  
 GitHub Actions  
 Azure Functions
Node.js

## Prerequisites to run on your environment

Node.js  
 npm  
 Git  
 An Azure account

## To build and test the app

Clone the repository:  
 `git clone https://github.com/AmalSresh/491-ParlAI.git`
From project root:

navigate to the frontend directory  
 `cd frontend`

Install dependencies  
 `npm install`  
 Start the frontend emulator  
 `npm run dev`

navigate to the backend directory  
 `cd backend`
In the terminal run  
 `npm run start`  
 If you want to simulate authentication, also run this in the root directory
`swa start`
and use the link to the emulator

This will start the Azure emulator to simulate authentication, database functions, and present the frontend.

## Create .env file in Project root

FACEBOOK_APP_ID=YOUR_FACEBOOK_APP_ID
FACEBOOK_APP_SECRET_APP_SETTING_NAME=YOUR_FACEBOOK_APP_SECRET_APP_SETTING_NAME
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET_APP_SETTING_NAME=YOUR_GOOGLE_CLIENT_SECRET_APP_SETTING_NAME
TWITTER_CONSUMER_KEY=YOUR_TWITTER_CONSUMER_KEY
TWITTER_CONSUMER_SECRET=YOUR_TWITTER_CONSUMER_SECRET
DATABASE_URL=YOUR_DATABASE_URL
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_SERVER=YOUR_DB_SERVER
DB_NAME=YOUR_DB_NAME
SOCCER_ODDS_API=YOUR_ODDS_API_KEY

## In your backend directory put this in local.settings.json file:

{
"IsEncrypted": false,
"Values": {
"FUNCTIONS_WORKER_RUNTIME": "node",
"DB_SERVER": "YOUR_DB_SERVER",
"DB_USER": "YOUR_DB_USER",
"DB_PASSWORD": "YOUR_DB_PASS",
"DB_NAME": "YOUR_DB_NAME",
"AzureWebJobsStorage": "UseDevelopmentStorage=true",
"SOCCER_ODDS_API": "YOUR_ODDS_API_KEY"
}
}

## SQL server connection

Go to your SQL server > Security > Networking:  
 Under firewall rules, select "Add your client IPv4 address" and allow Azure services and resources to access this server

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
 An Azure account (If deploying)

## To build and test the app

Clone the repository:  
 `git clone https://github.com/AmalSresh/491-ParlAI.git`
From project root:

navigate to the frontend directory  
 `cd frontend`

Install dependencies  
 `npm install`
navigate to the backend directory  
 `cd backend`

Install dependencies  
 `npm install`

Start up backend functions (in /backend)  
 `npm run start`

In the root directory run  
 `swa start`

This will start the Azure emulator to simulate authentication, database control, and present the frontend.

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

## SQL server connection

Go to your SQL server > Security > Networking:  
 Under firewall rules, select "Add your client IPv4 address" and allow Azure services and resources to access this server

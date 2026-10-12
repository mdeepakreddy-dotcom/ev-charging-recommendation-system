EV SmartCharge – EV Charging Station Analysis and Recommendation System
EV SmartCharge is a web application designed to help electric vehicle (EV) drivers find suitable charging stations and plan longer journeys with charging stops. It brings together a frontend, backend API, and data storage to support station recommendations.

Project note: Update feature descriptions if your current implementation differs. Do not describe simulated station data as live charging-network data.

Features
User registration and login (if enabled in the current build)
EV and battery details input
Charging-station recommendations based on vehicle and station information
Station filtering using connector type, availability, distance, charging speed, and ratings where implemented
Long-trip planning with suggested charging stops, where implemented
Backend API built with Node.js and Express
SQLite database for application data
Web interface built with React and Vite
Technology Stack
Layer	Technologies
Frontend	React, Vite, JavaScript, CSS
Backend	Node.js, Express
Database	SQLite (better-sqlite3)
Authentication	JSON Web Tokens (JWT), bcryptjs
Environment configuration	dotenv
Version control	Git and GitHub
Project Structure
ev-charging-analysis/
├── backend/
│   ├── data/                 # Local application data (if used)
│   ├── auth.js               # Authentication helpers
│   ├── database.js           # Database connection
│   ├── recommendation.js     # Recommendation logic
│   ├── server.js             # Express server
│   ├── userData.js           # User-related data handling
│   ├── package.json
│   └── .env                  # Local secrets; do not commit
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
The exact files and folders may vary depending on your current project version.

Requirements
Install Node.js and npm before running the project. Git and Visual Studio Code are recommended.

Check your installation:

node --version
npm.cmd --version
Setup and Installation
1. Clone the repository
git clone https://github.com/mdeepakreddy-dotcom/ev-charging-recommendation-system.git
cd ev-charging-recommendation-system
If you already have the project locally, open its root folder instead.

2. Install backend dependencies
From the project root:

npm.cmd --prefix backend install
3. Configure environment variables
Create a file named .env inside the backend folder:

JWT_SECRET=replace_with_a_new_random_secret
Generate a strong secret locally:

node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Copy the generated value into backend/.env yourself. Never share the secret or commit .env to GitHub. If a secret has been exposed, generate a new one.

The backend is configured to load backend/.env. Add other environment variables only if your code requires them.

4. Install frontend dependencies
From the project root:

npm.cmd --prefix frontend install
Run the Application
Keep the frontend and backend running in separate terminals.

Terminal 1: Start the backend
From the project root:

node backend/server.js
Use the port shown by your server configuration.

Terminal 2: Start the frontend
From the project root:

cd frontend
npm.cmd run dev
Open the local URL shown by Vite in your browser, usually:

http://localhost:5173
If the frontend cannot connect to the backend, check the backend port, frontend API URL, and CORS configuration.

Windows PowerShell tip: If npm run ... fails because PowerShell blocks npm.ps1, use npm.cmd run ... instead. This avoids changing the PowerShell execution policy.

How to Use
Start the backend and frontend.
Open the local frontend URL in a browser.
Register an account or log in if authentication is enabled.
Enter the vehicle, battery, and location details requested by the interface.
Review the station recommendations and the details displayed.
If trip planning is implemented, enter a destination and review the suggested charging stops.
Log out when finished.
The exact screens and inputs depend on the current implementation.

Security and Data Notes
Keep backend/.env private; do not commit credentials or tokens.
The .gitignore should exclude .env files, node_modules, build output, and local SQLite database files.
Do not put real user data or production credentials in a public repository.
Use HTTPS, secure deployment configuration, input validation, and appropriate authentication protections before deploying publicly.
Station availability, prices, reviews, and route estimates are real-time only if the application connects to verified live data sources. Otherwise, label them as sample or simulated data.
Troubleshooting
PowerShell says scripts are disabled
Use:

npm.cmd run dev
Backend says JWT_SECRET is missing
Confirm that backend/.env exists and contains a non-empty JWT_SECRET line. Do not paste the secret into issue reports or chats.

Port is already in use
Close the other process using the port or configure the application to use another available port. Ensure the frontend points to the correct backend port.

Frontend opens but API requests fail
Check that:

The backend is running.
The frontend uses the correct backend API URL.
CORS is configured for the frontend origin.
The browser console and backend terminal do not show request errors.
SQLite-related issues
Stop the backend before investigating database problems. Back up the local database before making changes, and do not delete database files unless you intend to remove the stored data.

GitHub
Repository: https://github.com/mdeepakreddy-dotcom/ev-charging-recommendation-system

Common Git commands:

git status
git add .
git commit -m "Describe your changes"
git push
Review git status before committing to ensure local secrets, database files, and generated dependencies are not included.

Future Enhancements
Integration with verified live charging-station data
Map-based station discovery and route visualization
More detailed charging-time and cost estimates
Improved station ranking with safety-reserve and reachability checks
Automated tests and deployment documentation
Author
Deepak Reddy

License
No license has been specified yet. Add a LICENSE file and update this section if you choose to publish the project under an open-source license.

# EV SmartCharge

EV SmartCharge is a web application for exploring EV charging stations, estimating charging cost and time, planning longer trips, saving stations, keeping trip history, and asking a retrieval-grounded charging assistant. The frontend is a React/Vite website; the backend is Java 21 with Spring Boot, Spring Security/JWT, and PostgreSQL-compatible SQL. No React Native mobile app is included.

## Project layout

```text
frontend/     React website; Netlify build output is frontend/dist/
backend/      Spring Boot REST API; PostgreSQL on Aiven; Dockerfile for Render
```

The checked-in station and vehicle catalog is reference data, not a live IoT feed. Station availability and pricing shown in the demo should not be treated as real-time.

## Run locally

Requirements: Java 21, Maven 3.9+, and Node.js/npm.

1. Start the API using its in-memory H2 SQL database:

   ```powershell
   cd backend
   mvn spring-boot:run
   ```

2. In another terminal, start the website:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. Open the Vite URL (normally `http://localhost:5173`), register an account, and explore the dashboard. In development, Vite proxies `/api` to `http://localhost:8080`. If your API uses another port, set `VITE_API_PROXY_TARGET` in `frontend/.env.local` (for example `http://localhost:8081`) and restart Vite. For production, set `VITE_API_URL` to the hosted API base.

The chatbot uses retrieval over the station catalog and an OpenAI-compatible chat-completions API. Set `AI_API_KEY` (and optionally `AI_API_URL`/`AI_MODEL`) in the backend environment to enable it. Without a key, the API reports that the assistant is not configured; it does not return a fake answer.

## Deploy the backend (Aiven PostgreSQL + Render Docker)

1. **Create the Aiven database.** In Aiven, create a PostgreSQL service and database. Copy the service hostname, port, database name, username, and password from Aiven's connection information. Keep these values private; do not commit them or place them in frontend variables.
2. **Push the code to GitHub.** Create a private repository if appropriate, add this project, and push the branch you want Render to deploy.
3. **Create a Render Web Service.** Connect the GitHub repository, select **Docker**, set **Root Directory** to `backend`, and use `./Dockerfile`. The Dockerfile builds and runs the API with Java 21. Render supplies the service's `PORT`; Spring Boot reads it automatically.
4. **Set Render environment variables** (Render Dashboard → service → Environment):

   | Key | Value |
   | --- | --- |
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<AIVEN_HOST>:<AIVEN_PORT>/<DATABASE>?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | Aiven database username |
   | `SPRING_DATASOURCE_PASSWORD` | Aiven database password |
   | `JWT_SECRET` | A newly generated random secret, at least 32 bytes |
   | `CORS_ALLOWED_ORIGINS` | Your exact Netlify site origin, e.g. `https://your-site.netlify.app` |
   | `CORS_ALLOWED_ORIGIN_PATTERNS` | Optional Netlify preview origins, e.g. `https://*.netlify.app` |
   | `AI_API_KEY` | Optional key for the configured OpenAI-compatible provider |
   | `AI_API_URL` | Optional; defaults to `https://api.openai.com/v1/chat/completions` |
   | `AI_MODEL` | Optional; defaults to `gpt-4o-mini` |

   Use the Aiven values in Render's environment settings—not in `application.properties`, Docker build arguments, or the React app. The application initializes its PostgreSQL tables from `backend/src/main/resources/schema.sql`.
5. Deploy the Render service. When it is live, verify `https://<render-service>.onrender.com/api/health` returns a healthy response. Copy the service's base URL for the frontend step.

## Deploy the frontend (Netlify)

1. In Netlify, import the GitHub repository (or use the manual deploy flow).
2. Set the base directory to `frontend`, the build command to `npm run build`, and the publish directory to `dist`.
3. Add the frontend environment variable **before building**:

   ```text
   VITE_API_URL=https://<render-service>.onrender.com/api
   ```

4. Trigger a fresh Netlify build. For manual deploy, run `npm run build` from `frontend` and drag the resulting `frontend/dist` folder into Netlify's deploy area. The `public/_redirects` file supports React Router routes on refresh.
5. Set the Netlify site name to the desired project name, then ensure Render's `CORS_ALLOWED_ORIGINS` contains the resulting exact `https://<site-name>.netlify.app` origin. Redeploy the Render service if its CORS setting changed.

## Build checks

```powershell
cd backend
mvn test
mvn package

cd ..\frontend
npm run build
npm run lint
```

Build the backend image from `backend/` with `docker build -t ev-smartcharge-api .`.

# EV SmartCharge website

This is the React/Vite web frontend for EV SmartCharge. It uses the Spring Boot API in `../backend`.

```powershell
npm install
npm run dev
```

The API defaults to `http://localhost:8080/api`. Set `VITE_API_URL` in the frontend environment to the deployed backend API base, for example `https://example.onrender.com/api`, before building for Netlify. See the repository [deployment guide](../README.md).

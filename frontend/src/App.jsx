import React, { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Stations from "./pages/Stations";
import Trips from "./pages/Trips";
import ChargingCalculator from "./pages/ChargingCalculator";
import Analytics from "./pages/Analytics";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import TripHistory from "./pages/TripHistory";

import Login from "./components/Login";
import Register from "./components/Register";
import ChatAssistant from "./components/ChatAssistant";

import { useAuth } from "./context/AuthContext";


function App() {

  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  const [
    showRegister,
    setShowRegister,
  ] = useState(false);


  /*
   * Authentication loading
   */

  if (loading) {

    return (
      <div className="auth-loading-screen">

        <div className="auth-loading-card">

          <div className="auth-loading-spinner"></div>

          <h2>
            EV SmartCharge
          </h2>

          <p>
            Checking your account...
          </p>

        </div>

      </div>
    );

  }


  /*
   * Login / Register
   */

  if (!isAuthenticated) {

    if (showRegister) {

      return (
        <Register
          onLogin={() =>
            setShowRegister(false)
          }
          onSuccess={() => {}}
        />
      );

    }


    return (
      <Login
        onRegister={() =>
          setShowRegister(true)
        }
        onSuccess={() => {}}
      />
    );

  }


  /*
   * Main application
   */

  return (
    <BrowserRouter>

      <ChatAssistant />

      <Routes>


        {/* HOME / DASHBOARD */}

        <Route
          path="/"
          element={
            <Home user={user} />
          }
        />


        {/* STATIONS */}

        <Route
          path="/stations"
          element={
            <Stations />
          }
        />


        {/* TRIP PLANNER */}

        <Route
          path="/trips"
          element={
            <Trips />
          }
        />

        <Route
          path="/trip-planner"
          element={
            <Trips />
          }
        />


        {/* CHARGING CALCULATOR */}

        <Route
          path="/charging-calculator"
          element={
            <ChargingCalculator />
          }
        />


        {/* TRIP HISTORY */}

        <Route
          path="/trip-history"
          element={
            <TripHistory />
          }
        />


        {/* ANALYTICS */}

        <Route
          path="/analytics"
          element={
            <Analytics />
          }
        />


        {/* FAVORITES */}

        <Route
          path="/favorites"
          element={
            <Favorites />
          }
        />


        {/* PROFILE */}

        <Route
          path="/profile"
          element={
            <Profile />
          }
        />


        {/* UNKNOWN PAGE */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );

}


export default App;
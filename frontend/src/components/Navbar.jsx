import React from "react";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function Navbar() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const displayName =
    user?.name ||
    user?.email?.split("@")[0] ||
    "EV Driver";

  const initial =
    displayName.charAt(0).toUpperCase();


  function handleLogout() {
    logout();
    navigate("/");
  }


  return (
    <header className="app-navbar">

      <div className="navbar-inner">

        {/* --------------------------------------- */}
        {/* BRAND */}
        {/* --------------------------------------- */}

        <NavLink
          to="/"
          className="navbar-brand"
        >

          <div className="brand-logo">
            ⚡
          </div>

          <div className="brand-text">

            <strong>
              EV SmartCharge
            </strong>

            <span>
              INTELLIGENT CHARGING
            </span>

          </div>

        </NavLink>


        {/* --------------------------------------- */}
        {/* NAVIGATION */}
        {/* --------------------------------------- */}

        <nav className="navbar-navigation">

          {/* DASHBOARD */}

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Dashboard
          </NavLink>


          {/* STATIONS */}

          <NavLink
            to="/stations"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Stations
          </NavLink>


          {/* TRIP PLANNER */}

          <NavLink
            to="/trips"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Trip Planner
          </NavLink>


          {/* CHARGING CALCULATOR */}

          <NavLink
            to="/charging-calculator"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Charging Calculator
          </NavLink>


          {/* ANALYTICS */}

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Analytics
          </NavLink>


          {/* FAVORITES */}

          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Favorites
          </NavLink>


          {/* TRIP HISTORY */}

          <NavLink
            to="/trip-history"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            Trip History
          </NavLink>

        </nav>


        {/* --------------------------------------- */}
        {/* USER */}
        {/* --------------------------------------- */}

        <div className="navbar-user">

          <NavLink
            to="/profile"
            className="user-profile"
          >

            <div className="user-info">

              <strong>
                {displayName}
              </strong>

              <span>
                EV Driver
              </span>

            </div>

            <div className="user-avatar">
              {initial}
            </div>

          </NavLink>


          <button
            type="button"
            className="logout-button"
            title="Logout"
            onClick={handleLogout}
          >
            ↪
          </button>

        </div>

      </div>

    </header>
  );
}

export default Navbar;
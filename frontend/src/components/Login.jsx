import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login({ onRegister, onSuccess }) {
  const { login } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );
      return;
    }

    try {
      setLoading(true);

      await login(
        email.trim(),
        password
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err.message ||
          "Login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-brand-panel">
          <div className="auth-brand-icon">
            ⚡
          </div>

          <h1>
            EV SmartCharge
          </h1>

          <p>
            Smart EV charging station
            analysis and recommendation
            system.
          </p>

          <div className="auth-feature-list">
            <div>
              <span>✓</span>
              Smart station recommendations
            </div>

            <div>
              <span>✓</span>
              Battery safety analysis
            </div>

            <div>
              <span>✓</span>
              Long-trip planning
            </div>

            <div>
              <span>✓</span>
              Charging cost estimation
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-header">
            <span className="auth-eyebrow">
              Welcome back
            </span>

            <h2>
              Login to your account
            </h2>

            <p>
              Access your EV charging
              dashboard.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="auth-input-group">
              <label htmlFor="login-email">
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="password-wrapper">
                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={onRegister}
            >
              Create Account
            </button>
          </div>

          <div className="auth-demo-note">
            <strong>Demo project</strong>

            <span>
              Your account data is stored by
              the EV SmartCharge backend.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

function Register({ onLogin, onSuccess }) {
  const { register } = useAuth();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
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

    if (!name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      await register(
        name.trim(),
        email.trim(),
        password
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">

        <div className="register-header">
          <div className="register-icon">
            ⚡
          </div>

          <span className="register-eyebrow">
            EV SmartCharge
          </span>

          <h1>
            Create your account
          </h1>

          <p>
            Start managing your EV charging
            journey with smart recommendations.
          </p>
        </div>

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          <div className="register-input-group">
            <label htmlFor="register-name">
              Full Name
            </label>

            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter your name"
              autoComplete="name"
              maxLength={60}
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="register-email">
              Email Address
            </label>

            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="register-input-group">
            <label htmlFor="register-password">
              Password
            </label>

            <div className="register-password-wrapper">
              <input
                id="register-password"
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
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />

              <button
                type="button"
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

          <div className="register-input-group">
            <label htmlFor="register-confirm">
              Confirm Password
            </label>

            <input
              id="register-confirm"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="register-error">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="register-submit-button"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>
        </form>

        <div className="register-login">
          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={onLogin}
          >
            Sign In
          </button>
        </div>

        <div className="register-security">
          🔒 Your password is securely
          hashed by the backend.
        </div>
      </div>
    </div>
  );
}

export default Register;
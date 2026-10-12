import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./StationReviews.css";
import { API_BASE_URL } from "../services/config";
const TOKEN_KEY = "evSmartChargeToken";

function getStationId(station) {
  return (
    station?.id ||
    station?.stationId ||
    station?.station_id ||
    station?.name
  );
}

function getStationName(station) {
  return (
    station?.name ||
    station?.stationName ||
    "Charging Station"
  );
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/* =========================================================
   STAR RATING
   ========================================================= */

function StarRating({
  rating,
  onChange,
  interactive = false,
}) {
  return (
    <div
      className={
        interactive
          ? "review-stars review-stars-interactive"
          : "review-stars"
      }
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={
            star <= Number(rating)
              ? "star active"
              : "star"
          }
          onClick={() => {
            if (interactive && onChange) {
              onChange(star);
            }
          }}
          disabled={!interactive}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(dateValue) {
  if (!dateValue) {
    return "Recently";
  }

  try {
    return new Date(dateValue).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch (error) {
    return "Recently";
  }
}

/* =========================================================
   STATION REVIEWS
   ========================================================= */

function StationReviews({
  stations = [],
  selectedStation = null,
}) {
  const [reviews, setReviews] = useState([]);

  const [activeStationId, setActiveStationId] =
    useState(
      selectedStation
        ? String(getStationId(selectedStation))
        : stations.length > 0
          ? String(getStationId(stations[0]))
          : ""
    );

  const [rating, setRating] = useState(0);

  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  /* =======================================================
     ACTIVE STATION
     ======================================================= */

  const activeStation = useMemo(() => {
    if (selectedStation) {
      return selectedStation;
    }

    return stations.find(
      (station) =>
        String(getStationId(station)) ===
        String(activeStationId)
    );
  }, [
    selectedStation,
    stations,
    activeStationId,
  ]);

  const stationId = activeStation
    ? String(getStationId(activeStation))
    : "";

  /* =======================================================
     LOAD REVIEWS FROM BACKEND
     ======================================================= */

  const loadReviews = async () => {
    if (!stationId) {
      setReviews([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}/reviews/${encodeURIComponent(
          stationId
        )}`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load reviews."
        );
      }

      setReviews(
        Array.isArray(data)
          ? data
          : data.reviews || []
      );
    } catch (err) {
      console.error(
        "Load reviews error:",
        err
      );

      setReviews([]);

      setError(
        err.message ||
          "Unable to load reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD WHEN STATION CHANGES
     ======================================================= */

  useEffect(() => {
    loadReviews();

    setRating(0);
    setComment("");
    setMessage("");
    setError("");
  }, [stationId]);

  /* =======================================================
     AVERAGE RATING
     ======================================================= */

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) =>
              total +
              Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : activeStation?.rating
        ? Number(activeStation.rating).toFixed(1)
        : "0.0";

  /* =======================================================
     RATING DISTRIBUTION
     ======================================================= */

  const ratingDistribution =
    [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter(
        (review) =>
          Number(review.rating) === star
      ).length;

      const percentage =
        reviews.length > 0
          ? Math.round(
              (count / reviews.length) * 100
            )
          : 0;

      return {
        star,
        count,
        percentage,
      };
    });

  /* =======================================================
     SUBMIT REVIEW
     ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!activeStation) {
      setError(
        "Please select a charging station."
      );
      return;
    }

    if (!rating) {
      setError(
        "Please select a star rating."
      );
      return;
    }

    if (comment.trim().length < 5) {
      setError(
        "Please write at least 5 characters."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setError(
        "Please login to submit a review."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            stationId,
            rating,
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to submit review."
        );
      }

      setRating(0);
      setComment("");

      setMessage(
        "Your review was submitted successfully."
      );

      await loadReviews();
    } catch (err) {
      console.error(
        "Submit review error:",
        err
      );

      setError(
        err.message ||
          "Unable to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     DELETE REVIEW
     ======================================================= */

  const handleDeleteReview = async (
    reviewId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this review?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    const token = getToken();

    if (!token) {
      setError(
        "Please login to remove a review."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews/${encodeURIComponent(
          reviewId
        )}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to remove review."
        );
      }

      setMessage(
        "Review removed successfully."
      );

      await loadReviews();
    } catch (err) {
      console.error(
        "Delete review error:",
        err
      );

      setError(
        err.message ||
          "Unable to remove review."
      );
    }
  };

  /* =======================================================
     NO STATION
     ======================================================= */

  if (
    !activeStation &&
    stations.length === 0
  ) {
    return (
      <section className="station-reviews">
        <div className="reviews-empty">
          <div className="reviews-empty-icon">
            ⭐
          </div>

          <h2>
            Reviews & Ratings
          </h2>

          <p>
            Select a charging station to view
            and write reviews.
          </p>
        </div>
      </section>
    );
  }

  /* =======================================================
     MAIN UI
     ======================================================= */

  return (
    <section className="station-reviews">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="reviews-header">
        <div>
          <span className="reviews-label">
            COMMUNITY FEEDBACK
          </span>

          <h2>
            Reviews & Ratings
          </h2>

          <p>
            See what EV drivers think about
            charging stations.
          </p>
        </div>
      </div>

      {/* =================================================
          STATION SELECTOR
          ================================================= */}

      {!selectedStation &&
        stations.length > 0 && (
          <div className="review-station-selector">
            <label>
              Charging Station
            </label>

            <select
              value={activeStationId}
              onChange={(event) => {
                setActiveStationId(
                  event.target.value
                );

                setMessage("");
                setError("");
                setRating(0);
                setComment("");
              }}
            >
              {stations.map((station) => (
                <option
                  key={getStationId(station)}
                  value={getStationId(station)}
                >
                  {getStationName(station)}
                </option>
              ))}
            </select>
          </div>
        )}

      {/* =================================================
          SUMMARY
          ================================================= */}

      <div className="reviews-summary">

        <div className="rating-overview">

          <div className="rating-number">
            {averageRating}
          </div>

          <StarRating
            rating={Math.round(
              Number(averageRating)
            )}
          />

          <span>
            {reviews.length > 0
              ? `${reviews.length} review${
                  reviews.length === 1
                    ? ""
                    : "s"
                }`
              : "No reviews yet"}
          </span>

        </div>

        <div className="rating-breakdown">

          {ratingDistribution.map(
            (item) => (
              <div
                key={item.star}
                className="rating-row"
              >
                <span>
                  {item.star} ★
                </span>

                <div className="rating-track">
                  <div
                    className="rating-fill"
                    style={{
                      width:
                        `${item.percentage}%`,
                    }}
                  ></div>
                </div>

                <span>
                  {item.count}
                </span>
              </div>
            )
          )}

        </div>

      </div>

      {/* =================================================
          WRITE REVIEW
          ================================================= */}

      <div className="write-review-card">

        <div className="write-review-heading">

          <div className="write-review-icon">
            ✍️
          </div>

          <div>
            <h3>
              Share your experience
            </h3>

            <p>
              Help other EV drivers choose
              the right charging station.
            </p>
          </div>

        </div>

        <form
          onSubmit={handleSubmit}
          className="review-form"
        >

          {/* RATING */}

          <div className="rating-input">

            <label>
              Your Rating
            </label>

            <div className="rating-input-row">

              <StarRating
                rating={rating}
                onChange={setRating}
                interactive
              />

              <span>
                {rating === 0
                  ? "Select a rating"
                  : `${rating} out of 5`}
              </span>

            </div>

          </div>

          {/* COMMENT */}

          <div className="comment-input">

            <label>
              Your Review
            </label>

            <textarea
              value={comment}
              onChange={(event) => {
                setComment(
                  event.target.value
                );

                setMessage("");
                setError("");
              }}
              placeholder="How was the charging speed, availability, cleanliness, staff support, or overall experience?"
              maxLength={500}
              rows={4}
            />

            <div className="character-count">
              {comment.length}/500
            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="review-message error">
              ⚠ {error}
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div className="review-message success">
              ✓ {message}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            className="submit-review-button"
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : "Submit Review"}
          </button>

        </form>

      </div>

      {/* =================================================
          REVIEW LIST
          ================================================= */}

      <div className="review-list-section">

        <div className="review-list-header">

          <div>
            <h3>
              Driver Reviews
            </h3>

            <p>
              {reviews.length === 0
                ? "Be the first to review this station."
                : `${reviews.length} review${
                    reviews.length === 1
                      ? ""
                      : "s"
                  } from EV drivers`}
            </p>
          </div>

        </div>

        {/* LOADING */}

        {loading ? (
          <div className="reviews-loading">
            <div className="reviews-spinner"></div>

            <p>
              Loading reviews...
            </p>
          </div>
        ) : reviews.length === 0 ? (

          /* EMPTY */

          <div className="reviews-empty-small">

            <div>
              💬
            </div>

            <h4>
              No reviews yet
            </h4>

            <p>
              Your experience can help the
              next EV driver.
            </p>

          </div>

        ) : (

          /* REVIEW LIST */

          <div className="review-list">

            {reviews.map((review) => (

              <article
                key={review.id}
                className="review-item"
              >

                <div className="review-user-avatar">
                  {(
                    review.userName ||
                    review.name ||
                    "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="review-content">

                  <div className="review-top">

                    <div>

                      <h4>
                        {review.userName ||
                          review.name ||
                          "EV Driver"}
                      </h4>

                      <div className="review-meta">

                        <StarRating
                          rating={Number(
                            review.rating
                          )}
                        />

                        <span>
                          {formatDate(
                            review.createdAt ||
                              review.created_at
                          )}
                        </span>

                      </div>

                    </div>

                    <button
                      type="button"
                      className="delete-review-button"
                      onClick={() =>
                        handleDeleteReview(
                          review.id ||
                            review.reviewId
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                  <p className="review-comment">
                    {review.comment}
                  </p>

                </div>

              </article>

            ))}

          </div>
        )}

      </div>

      {/* =================================================
          BACKEND NOTE
          ================================================= */}

      <div className="reviews-note">

        <span>
          ℹ️
        </span>

        <p>
          Reviews are stored securely in the
          EV SmartCharge SQLite database and
          are linked to your account.
        </p>

      </div>

    </section>
  );
}

export default StationReviews;
import { useState } from "react";
import { API_BASE_URL } from "../services/config";
import "./ChatAssistant.css";

const TOKEN_KEY = "evSmartChargeToken";

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(event) {
    event.preventDefault();
    const text = question.trim();
    if (!text || loading) return;

    setMessages((current) => [...current, { role: "user", text }]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY) || ""}`,
        },
        body: JSON.stringify({ question: text }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Unable to reach the EV assistant.");
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.answer, sources: data.sources || [] },
      ]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-assistant">
      {open && (
        <section className="chat-panel" aria-label="EV SmartCharge assistant">
          <header className="chat-panel-header">
            <div>
              <strong>Charging assistant</strong>
              <span>Station answers grounded in available data</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">×</button>
          </header>
          <div className="chat-messages" aria-live="polite">
            {messages.length === 0 && (
              <p className="chat-empty">Ask about connector types, charging speed, availability, or station prices.</p>
            )}
            {messages.map((message, index) => (
              <article className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                <p>{message.text}</p>
                {message.sources?.length > 0 && (
                  <small>Sources: {message.sources.map((source) => source.name).join(", ")}</small>
                )}
              </article>
            ))}
            {loading && <p className="chat-loading">Checking station information…</p>}
            {error && <p className="chat-error" role="alert">{error}</p>}
          </div>
          <form className="chat-form" onSubmit={sendMessage}>
            <label className="visually-hidden" htmlFor="assistant-question">Your question</label>
            <input
              id="assistant-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about charging…"
              maxLength={1000}
            />
            <button type="submit" disabled={loading || !question.trim()}>Send</button>
          </form>
        </section>
      )}
      <button
        className="chat-launcher"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Close charging assistant" : "Open charging assistant"}
      >
        {open ? "×" : "⚡"}
      </button>
    </div>
  );
}

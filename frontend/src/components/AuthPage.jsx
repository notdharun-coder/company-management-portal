import { useState } from "react";

export default function AuthPage({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signup";

  function update(field, value) {
    setForm({ ...form, [field]: value });
    setError("");
  }

  async function submit(event) {
    event.preventDefault();

    if (isSignUp && !form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await onSignUp({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      } else {
        await onSignIn({
          email: form.email.trim(),
          password: form.password,
        });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <h1>{isSignUp ? "Create Account" : "Login"}</h1>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => setMode("signin")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {isSignUp && (
          <label>
            Name
            <input value={form.name} onChange={(event) => update("name", event.target.value)} />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
        </button>
      </form>
    </main>
  );
}

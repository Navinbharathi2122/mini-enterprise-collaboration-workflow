import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const AUTH0_DB_CONNECTION = import.meta.env.VITE_AUTH0_DB_CONNECTION || "Username-Password-Authentication";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLocal(e) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const response = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to submit request. Please try again.");
    } finally { setLoading(false); }
  }

  async function submitAuth0() {
    setLoading(true); setError(""); setMessage("");
    if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
      setError("Auth0 is not configured. Please contact the administrator.");
      setLoading(false);
      return;
    }
    try {
      await axios.post(`https://${AUTH0_DOMAIN}/dbconnections/change_password`, {
        client_id: AUTH0_CLIENT_ID,
        email,
        connection: AUTH0_DB_CONNECTION,
      });
      setMessage("If an account exists for that email, password reset instructions will be sent by Auth0.");
    } catch {
      // Avoid exposing account existence or provider-specific account state.
      setMessage("If an account exists for that email, password reset instructions will be sent by Auth0.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-600">Enter the email address associated with your account.</p>
        <form onSubmit={submitLocal}>
          <label className="mt-6 block text-sm font-medium">Email</label>
          <input className="mt-1 w-full rounded border p-3" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={loading} type="submit" className="mt-5 w-full rounded bg-slate-800 p-3 text-white disabled:opacity-60">{loading ? "Submitting…" : "Send local MECW reset instructions"}</button>
        </form>
        <button disabled={loading || !email} type="button" onClick={submitAuth0} className="mt-3 w-full rounded bg-blue-700 p-3 text-white disabled:opacity-60">Send Auth0 password reset</button>
        <p className="mt-3 text-xs text-slate-500">Google and Microsoft account passwords must be recovered with the respective provider.</p>
        {message && <p role="status" className="mt-4 text-green-700">{message}</p>}
        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        <Link className="mt-5 block text-blue-700" to="/">Back to login</Link>
      </section>
    </main>
  );
}

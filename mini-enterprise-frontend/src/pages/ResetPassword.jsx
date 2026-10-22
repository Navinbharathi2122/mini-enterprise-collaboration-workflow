import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setMessage("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    // The fragment is not sent in HTTP requests, reducing token exposure in access logs.
    const token = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token");
    if (!token) { setError("Reset token is missing from the link."); return; }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/auth/reset-password`, { token, new_password: password });
      setMessage(response.data.message);
      window.history.replaceState(null, "", window.location.pathname);
    } catch (err) {
      setError(err.response?.data?.detail || "Reset link is invalid or expired.");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Reset local MECW password</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a new password with at least 12 characters.</p>
        <label className="mt-5 block text-sm font-medium">New password</label>
        <input className="mt-1 w-full rounded border p-3" type="password" minLength={12} maxLength={128} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="mt-4 block text-sm font-medium">Confirm password</label>
        <input className="mt-1 w-full rounded border p-3" type="password" minLength={12} maxLength={128} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button disabled={loading} className="mt-5 w-full rounded bg-blue-700 p-3 text-white disabled:opacity-60">{loading ? "Resetting…" : "Reset password"}</button>
        {message && <p role="status" className="mt-4 text-green-700">{message}</p>}
        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        <Link className="mt-5 block text-blue-700" to="/">Back to login</Link>
      </form>
    </main>
  );
}

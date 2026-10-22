import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/axios";

export default function Profile() {
  const { user, isAuthenticated } = useAuth0();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) return undefined;
    api.get("/users/me")
      .then((response) => { if (!cancelled) setProfile(response.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.detail || "Could not load your backend profile."); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Navbar />
        <section className="mx-auto max-w-4xl p-6 md:p-10">
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Auth0 identity and MECW account profile</p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {user?.picture ? <img src={user.picture} alt="Profile" className="h-16 w-16 rounded-full" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">{(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}</div>}
              <div><h2 className="text-lg font-semibold">{profile?.name || user?.name || "User"}</h2><p className="text-sm text-slate-500">{profile?.email || user?.email || "Email unavailable"}</p></div>
            </div>
            {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold uppercase text-slate-500">MECW User ID</dt><dd className="mt-1 font-medium">{profile?.id ?? profile?.user_id ?? "Loading…"}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold uppercase text-slate-500">Role</dt><dd className="mt-1 font-medium capitalize">{profile?.role || "Loading…"}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold uppercase text-slate-500">Account Status</dt><dd className="mt-1 font-medium">{profile ? (profile.is_active ? "Active" : "Inactive") : "Loading…"}</dd></div>
              <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-semibold uppercase text-slate-500">Auth0 Subject</dt><dd className="mt-1 break-all text-sm">{user?.sub || "Unavailable"}</dd></div>
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}


import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

function Navbar() {
  const {
    user,
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
  } = useAuth0();

  const [role, setRole] = useState(null);
  console.log("Sidebar auth status:", { isAuthenticated, isLoading });
  const [roleError, setRoleError] = useState("");

  const username = isLoading
    ? "Loading..."
    : isAuthenticated
    ? user?.name || user?.nickname || user?.email || "User"
    : "Guest";

  const email = isAuthenticated
    ? user?.email || "Email not available"
    : "Not signed in";

  useEffect(() => {
    let cancelled = false;

    async function fetchRole() {
      if (!isAuthenticated) {
        setRole(null);
        setRoleError("");
        return;
      }

      try {
        setRoleError("");

        const token = await getAccessTokenSilently();

        const response = await fetch(
          "http://127.0.0.1:8000/users/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const details = await response.text();
          throw new Error(
            `Backend returned ${response.status}: ${details}`
          );
        }

        const data = await response.json();

        if (!data.role) {
          throw new Error("Backend response has no role field.");
        }

        if (!cancelled) {
          setRole(String(data.role).toLowerCase());
        }
      } catch (error) {
        console.error("Navbar role fetch failed:", error);

        if (!cancelled) {
          setRole(null);
          setRoleError(error.message || "Could not fetch role");
        }
      }
    }

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, getAccessTokenSilently]);

  const avatarLetter = username.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Enterprise Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {username}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right md:block">
            <h3 className="text-sm font-semibold text-slate-800">
              {username}
            </h3>

            <p className="text-xs text-slate-500">{email}</p>
          </div>

          {isAuthenticated && user?.picture ? (
            <img
              src={user.picture}
              alt="Profile"
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {avatarLetter}
            </div>
          )}

          <span
            title={roleError || ""}
            className={`hidden rounded-full px-3 py-1 text-xs font-semibold capitalize md:inline-flex ${
              role === "admin"
                ? "bg-slate-900 text-white"
                : role === "manager"
                ? "bg-emerald-100 text-emerald-700"
                : role
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isLoading
              ? "Loading..."
              : role
              ? role
              : roleError
              ? "Role unavailable"
              : "Loading role..."}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
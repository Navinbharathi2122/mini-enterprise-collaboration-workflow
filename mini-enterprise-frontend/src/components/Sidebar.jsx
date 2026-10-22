
import { NavLink } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

function Sidebar() {
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [role, setRole] = useState(null);
  console.log("Sidebar auth status:", { isAuthenticated, isLoading });
  const [roleError, setRoleError] = useState("");

  const username = isLoading
    ? "Loading..."
    : isAuthenticated
    ? user?.name || user?.nickname || user?.email || "User"
    : "Guest User";

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
        console.error("Sidebar role fetch failed:", error);

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

  const menuItem =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200";

  const activeMenu = "bg-blue-700 text-white shadow-md";
  const normalMenu = "text-slate-300 hover:bg-slate-800 hover:text-white";

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const isAdminOrManager = role === "admin" || role === "manager";

  return (
    <aside className="sticky left-0 top-0 z-50 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950">
      <div className="shrink-0 border-b border-slate-800 px-6 py-7">
        <h1 className="text-3xl font-extrabold tracking-wide text-white">
          STACKLY
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
          Workflow Management
        </p>
      </div>

      <div className="shrink-0 border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          {isAuthenticated && user?.picture ? (
            <img
              src={user.picture}
              alt="Profile"
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
              {avatarLetter}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white">
              {username}
            </h3>
            <p className="truncate text-xs text-slate-400">{email}</p>
          </div>
        </div>

        <span
          className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            role === "admin"
              ? "bg-blue-100 text-blue-700"
              : role === "manager"
              ? "bg-emerald-100 text-emerald-700"
              : role
              ? "bg-orange-100 text-orange-700"
              : "bg-slate-700 text-white"
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

        {roleError && (
          <p className="mt-2 break-words text-xs text-red-400">
            {roleError}
          </p>
        )}
      </div>

      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-6">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${menuItem} ${isActive ? activeMenu : normalMenu}`
          }
        >
          <span className="text-lg">👤</span>
          My Profile
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${menuItem} ${isActive ? activeMenu : normalMenu}`
          }
        >
          <span className="text-lg">📊</span>
          Dashboard
        </NavLink>

        {isAdminOrManager && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `${menuItem} ${isActive ? activeMenu : normalMenu}`
            }
          >
            <span className="text-lg">👥</span>
            Users
          </NavLink>
        )}

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `${menuItem} ${isActive ? activeMenu : normalMenu}`
          }
        >
          <span className="text-lg">🗂️</span>
          Tasks
        </NavLink>

        <NavLink
          to="/kanban"
          className={({ isActive }) =>
            `${menuItem} ${isActive ? activeMenu : normalMenu}`
          }
        >
          <span className="text-lg">📌</span>
          Kanban Board
        </NavLink>

        <NavLink
          to="/approvals"
          className={({ isActive }) =>
            `${menuItem} ${isActive ? activeMenu : normalMenu}`
          }
        >
          <span className="text-lg">✅</span>
          Approvals
        </NavLink>

        <NavLink
          to="/leave-requests"
          className={({ isActive }) =>
            `${menuItem} ${isActive ? activeMenu : normalMenu}`
          }
        >
          <span className="text-lg">🌴</span>
          Leave Requests
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `${menuItem} ${isActive ? activeMenu : normalMenu}`
          }
        >
          <span className="text-lg">🔔</span>
          Notifications
        </NavLink>

        {isAdminOrManager && (
          <NavLink
            to="/audit-logs"
            className={({ isActive }) =>
              `${menuItem} ${isActive ? activeMenu : normalMenu}`
            }
          >
            <span className="text-lg">📜</span>
            Audit Logs
          </NavLink>
        )}
      </nav>

      <div className="shrink-0 border-t border-slate-800 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500 px-4 py-3 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-600 hover:text-white"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

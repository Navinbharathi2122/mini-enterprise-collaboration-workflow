import { NavLink, useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/jwt";

function Sidebar() {
  const navigate = useNavigate();
  const user = getUserFromToken();

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  const menuItem =
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200";

  const activeMenu = "bg-blue-700 text-white shadow-md";
  const normalMenu = "text-slate-300 hover:bg-slate-800 hover:text-white";

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-6 py-7">
        <h1 className="text-3xl font-extrabold tracking-wide text-white">
          STACKLY
        </h1>

        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
          Workflow Management
        </p>
      </div>

      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {user?.name || "Guest User"}
            </h3>

            <p className="truncate text-xs text-slate-400">
              {user?.email || "guest@stackly.com"}
            </p>
          </div>
        </div>

        <span
          className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            user?.role === "admin"
              ? "bg-blue-100 text-blue-700"
              : user?.role === "manager"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {user?.role}
        </span>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${menuItem} ${isActive ? activeMenu : normalMenu}`
          }
        >
          <span className="text-lg">📊</span>
          Dashboard
        </NavLink>

        {(user?.role === "admin" || user?.role === "manager") && (
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
      </nav>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={logout}
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
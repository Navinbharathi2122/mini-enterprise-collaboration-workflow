import { getUserFromToken } from "../utils/jwt";

function Navbar() {
  const currentUser = getUserFromToken();

  const username =
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "Guest";

  const email = currentUser?.email || "guest@stackly.com";
  const role = currentUser?.role || "employee";

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

          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {avatarLetter}
          </div>

          <span
            className={`hidden rounded-full px-3 py-1 text-xs font-semibold capitalize md:inline-flex ${
              role === "admin"
                ? "bg-slate-900 text-white"
                : role === "manager"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {role}
          </span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { setAuth0TokenGetter } from "./services/axios";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import Tasks from "./pages/Tasks";
import Kanban from "./pages/Kanban";
import Approvals from "./pages/Approvals";
import LeaveRequests from "./pages/LeaveRequests";
import Notifications from "./pages/Notifications";
import AuditLogs from "./pages/AuditLogs";

import AuthLoginAudit from "./components/AuthLoginAudit";
import GetToken from "./GetToken";

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <p className="text-lg font-medium text-slate-700">
        Checking authentication...
      </p>
    </div>
  );
}

// Auth0 access-token setup and User Service profile sync
function AuthTokenProvider({ children }) {
  const {
    isAuthenticated,
    isLoading,
    getAccessTokenSilently,
  } = useAuth0();

  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    console.info("[Auth0 debug]", {
      isAuthenticated,
      isLoading,
      audienceConfigured: Boolean(
        import.meta.env.VITE_AUTH0_AUDIENCE
      ),
      userServiceUrl:
        import.meta.env.VITE_USER_SERVICE_URL ||
        "http://localhost:8002",
    });
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    let cancelled = false;

    async function setupToken() {
      if (isLoading) return;

      setReady(false);
      setErrorMessage("");

      if (!isAuthenticated) {
        setAuth0TokenGetter(null);
        setReady(true);
        console.info("[Auth0 debug] User is not authenticated.");
        return;
      }

      const getter = () =>
        getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          },
        });

      try {
        const token = await getter();

        if (cancelled) return;

        if (!token) {
          throw new Error("Auth0 returned an empty access token.");
        }

        // Never print the access token.
        console.info("[Auth0 debug] Access token obtained.");

        const userServiceUrl =
          import.meta.env.VITE_USER_SERVICE_URL ||
          "http://localhost:8002";

        const provisionResponse = await fetch(
          `${userServiceUrl}/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!provisionResponse.ok) {
          const details = await provisionResponse.text();

          throw new Error(
            `User Service profile sync failed (${provisionResponse.status}): ${details}`
          );
        }

        console.info(
          "[Auth0 debug] User Service profile sync succeeded."
        );

        if (cancelled) return;

        setAuth0TokenGetter(getter);
        setReady(true);
      } catch (error) {
        if (cancelled) return;

        console.error("[Auth0 debug] Token setup failed:", {
          message: error?.message || "Unknown authentication error",
        });

        setAuth0TokenGetter(null);

        setErrorMessage(
          error?.message || "Unable to obtain Auth0 access token."
        );
      }
    }

    setupToken();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, getAccessTokenSilently]);

  if (
    isLoading ||
    (isAuthenticated && !ready && !errorMessage)
  ) {
    return <AuthLoading />;
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h2 className="text-xl font-bold text-red-700">
            Authentication Error
          </h2>
          <p className="mt-2">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return children;
}

// Protect routes that require authentication
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return <AuthLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protect routes according to the backend user role
function RoleProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [roleError, setRoleError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchRole() {
      if (isLoading) return;

      if (!isAuthenticated) {
        setRole(null);
        setRoleError("");
        setLoadingRole(false);
        return;
      }

      setLoadingRole(true);
      setRoleError("");

      try {
        const { default: api } = await import("./services/axios");

        // The Axios request interceptor attaches the Auth0 token.
        const response = await api.get("/users/me");
        const currentUser = response.data;

        // Log only role and HTTP status; never log tokens or user details.
        console.info("[RBAC] User API status:", response.status);
        console.info("[RBAC] Role received:", currentUser?.role);
        console.info("[RBAC] Allowed roles:", allowedRoles);

        if (!currentUser?.role) {
          throw new Error(
            "Backend response does not contain a role."
          );
        }

        const normalizedRole = String(currentUser.role)
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_");

        if (!cancelled) {
          setRole(normalizedRole);
          console.info("[RBAC] Normalized role:", normalizedRole);
        }
      } catch (error) {
        const status = error.response?.status ?? null;
        const detail =
          error.response?.data?.detail ||
          error.message ||
          "Unknown role verification error";

        console.error("[RBAC] Role verification failed:", {
          status: status ?? "No HTTP response",
          detail,
        });

        if (!cancelled) {
          setRole(null);
          setRoleError(
            "Unable to verify your role. Please check backend authentication."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingRole(false);
        }
      }
    }

    fetchRole();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, allowedRoles]);

  if (isLoading || loadingRole) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roleError) {
    return (
      <div className="p-6 text-center text-red-700">
        {roleError}
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    console.warn("[RBAC] Access denied for role:", role);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <>
      {/* Temporary token testing component */}
      <GetToken />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "admin",
                "administrator",
                "super_admin",
                "superadmin",
                "manager",
                "team_leader",
                "teamleader",
              ]}
            >
              <Users />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kanban"
          element={
            <ProtectedRoute>
              <Kanban />
            </ProtectedRoute>
          }
        />

        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <Approvals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leave-requests"
          element={
            <ProtectedRoute>
              <LeaveRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "admin",
                "administrator",
                "super_admin",
                "superadmin",
                "manager",
                "team_leader",
                "teamleader",
              ]}
            >
              <AuditLogs />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </>
  );
}

export default function App() {
  const { isLoading, error } = useAuth0();

  if (isLoading) return <AuthLoading />;

  if (error) {
    return (
      <div className="p-6 text-center text-red-700">
        Authentication Error: {error.message}
      </div>
    );
  }

  return (
    <AuthTokenProvider>
      <AuthLoginAudit />

      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthTokenProvider>
  );
}
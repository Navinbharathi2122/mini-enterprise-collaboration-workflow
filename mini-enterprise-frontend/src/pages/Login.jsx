
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

function Login() {
  const navigate = useNavigate();

  const {
    loginWithRedirect,
    isAuthenticated,
    isLoading,
  } = useAuth0();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await loginWithRedirect({
        authorizationParams: {
          screen_hint: "login",
          ...(email.trim()
            ? { login_hint: email.trim() }
            : {}),
        },
        appState: {
          returnTo: "/dashboard",
        },
      });
    } catch (error) {
      console.error("Email login error:", error);
      alert("Unable to start login. Please try again.");
      setLoading(false);
    }
  };

  const handleSocialLogin = async (connection) => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection,
          screen_hint: "login",
        },
        appState: {
          returnTo: "/dashboard",
        },
      });
    } catch (error) {
      console.error("Social login error:", error);
      alert("Unable to start login. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Checking login...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3">
        <p>Already signed in.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white"
        >
          Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-wide text-slate-900">
            STACKLY
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enterprise Workflow Management System
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocialLogin(import.meta.env.VITE_AUTH0_GOOGLE_CONNECTION || "google-oauth2")}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin(import.meta.env.VITE_AUTH0_MICROSOFT_CONNECTION || "windowslive")}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Continue with Microsoft
          </button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-500">
            OR SIGN IN WITH EMAIL
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Redirecting..." : "Continue with Email"}
          </button>
        <div className="mt-4 text-right"><a className="text-sm text-blue-700" href="/forgot-password">Forgot password?</a></div></form>

        <p className="mt-6 text-center text-xs text-slate-500">
          You will enter your password securely on the Auth0 login page.
        </p>

        <div className="mt-6 border-t border-slate-200 pt-5 text-center">
          <p className="text-xs text-slate-500">
            Secure access for authorized Stackly users only.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

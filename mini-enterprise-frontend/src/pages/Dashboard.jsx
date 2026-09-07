import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { getDashboardStats } from "../services/dashboardService";
import { getUserFromToken } from "../utils/jwt";

function Dashboard() {
  const navigate = useNavigate();
  const currentUser = getUserFromToken();

  const username =
    currentUser?.name ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const [stats, setStats] = useState({
    total_users: 0,
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const data = await getDashboardStats();

      setStats({
        total_users: data.total_users || 0,
        total_tasks: data.total_tasks || 0,
        completed_tasks: data.completed_tasks || 0,
        pending_tasks: data.pending_tasks || 0,
      });
    } catch (error) {
      console.error("Dashboard API Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    stats.total_tasks > 0
      ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
      : 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <section className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-800 p-8 text-white shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-200">
              Enterprise Workflow Management
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Welcome back, {username}
            </h1>

            <p className="mt-3 max-w-2xl text-slate-300">
              Manage users, assign tasks, monitor progress, and track enterprise
              productivity from a centralized workflow dashboard.
            </p>
          </section>

          {loading ? (
            <div className="flex h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-700 border-t-transparent"></div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading dashboard...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                    👥
                  </div>

                  <p className="text-sm text-slate-500">Total Users</p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {stats.total_users}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-2xl">
                    📋
                  </div>

                  <p className="text-sm text-slate-500">Total Tasks</p>

                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    {stats.total_tasks}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                    ✅
                  </div>

                  <p className="text-sm text-slate-500">Completed Tasks</p>

                  <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                    {stats.completed_tasks}
                  </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl">
                    ⏳
                  </div>

                  <p className="text-sm text-slate-500">Pending Tasks</p>

                  <h2 className="mt-2 text-3xl font-bold text-amber-600">
                    {stats.pending_tasks}
                  </h2>
                </div>
              </section>

              <section className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                      Enterprise Overview
                    </h2>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Live Data
                    </span>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="text-sm text-slate-500">Users</p>

                        <h3 className="text-2xl font-bold text-slate-900">
                          {stats.total_users}
                        </h3>
                      </div>

                      <span className="text-2xl">👥</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="text-sm text-slate-500">Tasks</p>

                        <h3 className="text-2xl font-bold text-slate-900">
                          {stats.total_tasks}
                        </h3>
                      </div>

                      <span className="text-2xl">📋</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="text-sm text-slate-500">Completed</p>

                        <h3 className="text-2xl font-bold text-emerald-600">
                          {stats.completed_tasks}
                        </h3>
                      </div>

                      <span className="text-2xl">✅</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                      <div>
                        <p className="text-sm text-slate-500">Pending</p>

                        <h3 className="text-2xl font-bold text-amber-600">
                          {stats.pending_tasks}
                        </h3>
                      </div>

                      <span className="text-2xl">⏳</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-bold text-slate-900">
                    Quick Insights
                  </h2>

                  <div className="space-y-5">
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-sm font-medium text-blue-700">
                        Completion Rate
                      </p>

                      <h3 className="mt-2 text-3xl font-bold text-blue-900">
                        {completionRate}%
                      </h3>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-sm font-medium text-emerald-700">
                        Completed Tasks
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-emerald-700">
                        {stats.completed_tasks}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-sm font-medium text-amber-700">
                        Pending Tasks
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-amber-700">
                        {stats.pending_tasks}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-sm font-medium text-slate-600">
                        Active Users
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-slate-800">
                        {stats.total_users}
                      </h3>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    Overall Task Progress
                  </h2>

                  <span className="text-sm font-medium text-slate-500">
                    {completionRate}% Completed
                  </span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-700 to-emerald-500 transition-all duration-700"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>

                <div className="mt-4 flex justify-between text-sm text-slate-500">
                  <span>{stats.completed_tasks} Completed</span>
                  <span>{stats.pending_tasks} Pending</span>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
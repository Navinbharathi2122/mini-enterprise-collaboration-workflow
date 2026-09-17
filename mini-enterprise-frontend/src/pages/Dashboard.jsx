import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { getDashboardSummary } from "../services/dashboardService";
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

    todo_tasks: 0,
    in_progress_tasks: 0,
    review_tasks: 0,
    done_tasks: 0,

    pending_approvals: 0,
    approved_requests: 0,
    rejected_requests: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const data = await getDashboardSummary();

      setStats({
        total_users: data.total_users || 0,
        total_tasks: data.total_tasks || 0,
        completed_tasks: data.completed_tasks || 0,
        pending_tasks: data.pending_tasks || 0,

        todo_tasks: data.todo_tasks || 0,
        in_progress_tasks: data.in_progress_tasks || 0,
        review_tasks: data.review_tasks || 0,
        done_tasks: data.completed_tasks || 0,

        pending_approvals: data.pending_approvals || 0,
        approved_requests: data.approved_requests || 0,
        rejected_requests: data.rejected_requests || 0,
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

  const dashboardCards = [
    {
      title: "Total Users",
      value: stats.total_users,
      icon: "👥",
      bg: "bg-blue-100",
      text: "text-blue-700",
    },
    {
      title: "Total Tasks",
      value: stats.total_tasks,
      icon: "📋",
      bg: "bg-indigo-100",
      text: "text-indigo-700",
    },
    {
      title: "Completed Tasks",
      value: stats.completed_tasks,
      icon: "✅",
      bg: "bg-emerald-100",
      text: "text-emerald-700",
    },
    {
      title: "Pending Tasks",
      value: stats.pending_tasks,
      icon: "⏳",
      bg: "bg-orange-100",
      text: "text-orange-700",
    },
    {
      title: "TODO Tasks",
      value: stats.todo_tasks,
      icon: "🟡",
      bg: "bg-yellow-100",
      text: "text-yellow-700",
    },
    {
      title: "In Progress",
      value: stats.in_progress_tasks,
      icon: "🔵",
      bg: "bg-sky-100",
      text: "text-sky-700",
    },
    {
      title: "Review Tasks",
      value: stats.review_tasks,
      icon: "🟣",
      bg: "bg-purple-100",
      text: "text-purple-700",
    },
    {
      title: "Done Tasks",
      value: stats.done_tasks,
      icon: "🟢",
      bg: "bg-green-100",
      text: "text-green-700",
    },
  ];

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
              Manage users, assign tasks, monitor Kanban workflow, approvals,
              and productivity from one dashboard.
            </p>
          </section>

          {loading ? (
            <div className="flex h-72 items-center justify-center rounded-3xl bg-white shadow-sm">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-700 border-t-transparent"></div>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading dashboard...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard Cards */}
              <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {dashboardCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.bg} text-2xl`}
                    >
                      {card.icon}
                    </div>

                    <p className="text-sm text-slate-500">{card.title}</p>

                    <h2 className={`mt-2 text-3xl font-bold ${card.text}`}>
                      {card.value}
                    </h2>
                  </div>
                ))}
              </section>

              {/* Enterprise Overview */}
              <section className="mt-8 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                      Kanban Workflow Overview
                    </h2>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Live Workflow
                    </span>
                  </div>

                  <div className="space-y-5">
                    {[
                      {
                        label: "🟡 TODO",
                        value: stats.todo_tasks,
                        color: "bg-yellow-500",
                      },
                      {
                        label: "🔵 IN PROGRESS",
                        value: stats.in_progress_tasks,
                        color: "bg-sky-500",
                      },
                      {
                        label: "🟣 REVIEW",
                        value: stats.review_tasks,
                        color: "bg-purple-500",
                      },
                      {
                        label: "🟢 DONE",
                        value: stats.done_tasks,
                        color: "bg-green-500",
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-2 flex justify-between text-sm font-semibold text-slate-700">
                          <span>{item.label}</span>
                          <span>{item.value}</span>
                        </div>

                        <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color}`}
                            style={{
                              width: `${
                                stats.total_tasks === 0
                                  ? 0
                                  : (item.value / stats.total_tasks) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Insights */}
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

                    <div className="rounded-xl bg-orange-50 p-4">
                      <p className="text-sm font-medium text-orange-700">
                        Pending Tasks
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-orange-700">
                        {stats.pending_tasks}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-sm font-medium text-slate-700">
                        Active Users
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        {stats.total_users}
                      </h3>
                    </div>
                  </div>
                </div>
              </section>

              {/* Approval Analytics */}
              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    Approval Analytics
                  </h2>

                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    Phase 2 Workflow
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-2xl bg-orange-50 p-5">
                    <div className="text-3xl">⏳</div>
                    <p className="mt-3 text-sm text-orange-700">
                      Pending Approvals
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-orange-800">
                      {stats.pending_approvals}
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-5">
                    <div className="text-3xl">✅</div>
                    <p className="mt-3 text-sm text-green-700">
                      Approved Requests
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-green-800">
                      {stats.approved_requests}
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-5">
                    <div className="text-3xl">❌</div>
                    <p className="mt-3 text-sm text-red-700">
                      Rejected Requests
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-red-800">
                      {stats.rejected_requests}
                    </h3>
                  </div>
                </div>
              </section>

              {/* Overall Progress */}
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

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-yellow-50 p-4 text-center">
                    <p className="text-sm text-yellow-700">TODO</p>
                    <h4 className="text-2xl font-bold text-yellow-800">
                      {stats.todo_tasks}
                    </h4>
                  </div>

                  <div className="rounded-xl bg-sky-50 p-4 text-center">
                    <p className="text-sm text-sky-700">IN PROGRESS</p>
                    <h4 className="text-2xl font-bold text-sky-800">
                      {stats.in_progress_tasks}
                    </h4>
                  </div>

                  <div className="rounded-xl bg-purple-50 p-4 text-center">
                    <p className="text-sm text-purple-700">REVIEW</p>
                    <h4 className="text-2xl font-bold text-purple-800">
                      {stats.review_tasks}
                    </h4>
                  </div>

                  <div className="rounded-xl bg-green-50 p-4 text-center">
                    <p className="text-sm text-green-700">DONE</p>
                    <h4 className="text-2xl font-bold text-green-800">
                      {stats.done_tasks}
                    </h4>
                  </div>
                </div>
              </section>

              {/* Refresh Button */}
              <section className="mt-8 flex justify-end">
                <button
                  onClick={fetchDashboardStats}
                  className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
                >
                  Refresh Dashboard
                </button>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
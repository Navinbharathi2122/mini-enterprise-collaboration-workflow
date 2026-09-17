import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import CreateLeaveModal from "../components/CreateLeaveModal";
import LeaveActionModal from "../components/LeaveActionModal";
import LeaveHistoryModal from "../components/LeaveHistoryModal";

import { getAllLeaveRequests } from "../services/leaveService";
import { getUserFromToken } from "../utils/jwt";

function LeaveRequests() {
  const currentUser = getUserFromToken();

  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";
  const isEmployee = currentUser?.role === "employee";

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      const data = await getAllLeaveRequests();
      setLeaveRequests(data);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((leave) => {
      const keyword = search.toLowerCase();

      const searchMatch =
        leave.leave_type?.toLowerCase().includes(keyword) ||
        leave.reason?.toLowerCase().includes(keyword) ||
        leave.requested_by_name?.toLowerCase().includes(keyword);

      const statusMatch =
        statusFilter === "all"
          ? true
          : leave.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [leaveRequests, search, statusFilter]);

  const dashboard = useMemo(() => {
    return {
      total: leaveRequests.length,

      pending: leaveRequests.filter(
        (leave) => leave.status === "pending"
      ).length,

      hold: leaveRequests.filter(
        (leave) => leave.status === "hold"
      ).length,

      approved: leaveRequests.filter(
        (leave) =>
          leave.status === "approved" ||
          leave.status === "manager_approved"
      ).length,

      rejected: leaveRequests.filter(
        (leave) => leave.status === "rejected"
      ).length,
    };
  }, [leaveRequests]);

  const analytics = useMemo(() => {
    const total = leaveRequests.length || 1;

    const approvalRate = Math.round(
      (dashboard.approved / total) * 100
    );

    const rejectionRate = Math.round(
      (dashboard.rejected / total) * 100
    );

    const holdRate = Math.round(
      (dashboard.hold / total) * 100
    );

    const utilizationRate = Math.round(
      ((dashboard.approved + dashboard.pending) / total) * 100
    );

    return {
      approvalRate,
      rejectionRate,
      holdRate,
      utilizationRate,
    };
  }, [leaveRequests, dashboard]);

  const monthlyTrend = useMemo(() => {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  const monthlyCount = new Array(12).fill(0);

  leaveRequests.forEach((leave) => {
    if (!leave.created_at) return;

    const monthIndex = new Date(leave.created_at).getMonth();
    monthlyCount[monthIndex]++;
  });

  return months.map((month, index) => ({
    month,
    count: monthlyCount[index],
  }));
}, [leaveRequests]);

// ================= PIE DATA =================

const pieData = useMemo(() => {
  const total = leaveRequests.length || 1;

  return [
    {
      label: "Approved",
      value: dashboard.approved,
      color: "#16A34A",
      percent: Math.round((dashboard.approved / total) * 100),
    },
    {
      label: "Pending",
      value: dashboard.pending,
      color: "#F59E0B",
      percent: Math.round((dashboard.pending / total) * 100),
    },
    {
      label: "Hold",
      value: dashboard.hold,
      color: "#9333EA",
      percent: Math.round((dashboard.hold / total) * 100),
    },
    {
      label: "Rejected",
      value: dashboard.rejected,
      color: "#DC2626",
      percent: Math.round((dashboard.rejected / total) * 100),
    },
  ];
}, [leaveRequests, dashboard]);

// ================= STATUS BADGES =================

const getStatusBadge = (status) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "manager_approved":
      return "bg-emerald-100 text-emerald-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "hold":
      return "bg-purple-100 text-purple-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "manager_approved":
      return "Manager Approved";
    case "approved":
      return "Approved";
    case "pending":
      return "Pending";
    case "hold":
      return "On Hold";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
};

const getLevelBadge = (level) => {
  switch (level) {
    case "manager":
      return "bg-blue-100 text-blue-700";
    case "admin":
      return "bg-indigo-100 text-indigo-700";
    case "completed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getLevelText = (level) => {
  switch (level) {
    case "manager":
      return "Manager Review";
    case "admin":
      return "Admin Review";
    case "completed":
      return "Completed";
    default:
      return level;
  }
};

const getProgressWidth = (value) => {
  return `${Math.min(value, 100)}%`;
};
 
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">

          {/* Header */}

          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Leave Request Management
              </h1>

              <p className="mt-2 text-slate-500">
                Apply, review and manage employee leave workflow across Stackly HRMS.
              </p>
            </div>

            {isEmployee && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-blue-800"
              >
                + Apply Leave
              </button>
            )}
          </div>

          {/* Dashboard Cards */}

          <div className="mb-8 grid gap-5 md:grid-cols-5">

            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-blue-600">Total Leaves</p>

              <h2 className="mt-2 text-3xl font-bold text-blue-700">
                {dashboard.total}
              </h2>

              <div className="mt-4 h-2 rounded-full bg-blue-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-yellow-600">Pending</p>

              <h2 className="mt-2 text-3xl font-bold text-yellow-700">
                {dashboard.pending}
              </h2>

              <div className="mt-4 h-2 rounded-full bg-yellow-100">
                <div
                  className="h-2 rounded-full bg-yellow-500"
                  style={{
                    width: getProgressWidth(analytics.utilizationRate),
                  }}
                ></div>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-purple-600">On Hold</p>

              <h2 className="mt-2 text-3xl font-bold text-purple-700">
                {dashboard.hold}
              </h2>

              <div className="mt-4 h-2 rounded-full bg-purple-100">
                <div
                  className="h-2 rounded-full bg-purple-600"
                  style={{
                    width: getProgressWidth(analytics.holdRate),
                  }}
                ></div>
              </div>
            </div>

            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-green-600">Approved</p>

              <h2 className="mt-2 text-3xl font-bold text-green-700">
                {dashboard.approved}
              </h2>

              <div className="mt-4 h-2 rounded-full bg-green-100">
                <div
                  className="h-2 rounded-full bg-green-600"
                  style={{
                    width: getProgressWidth(analytics.approvalRate),
                  }}
                ></div>
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-red-600">Rejected</p>

              <h2 className="mt-2 text-3xl font-bold text-red-700">
                {dashboard.rejected}
              </h2>

              <div className="mt-4 h-2 rounded-full bg-red-100">
                <div
                  className="h-2 rounded-full bg-red-600"
                  style={{
                    width: getProgressWidth(analytics.rejectionRate),
                  }}
                ></div>
              </div>
            </div>

          </div>

          {/* Enterprise Analytics Cards */}

          <div className="mb-8 grid gap-5 md:grid-cols-4">

            <div className="rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-5 text-white shadow-lg">
              <p className="text-sm opacity-90">Approval Rate</p>

              <h2 className="mt-2 text-3xl font-bold">
                {analytics.approvalRate}%
              </h2>

              <p className="mt-2 text-xs opacity-80">
                Approved leave requests
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-5 text-white shadow-lg">
              <p className="text-sm opacity-90">Rejection Rate</p>

              <h2 className="mt-2 text-3xl font-bold">
                {analytics.rejectionRate}%
              </h2>

              <p className="mt-2 text-xs opacity-80">
                Rejected leave requests
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 p-5 text-white shadow-lg">
              <p className="text-sm opacity-90">Hold Rate</p>

              <h2 className="mt-2 text-3xl font-bold">
                {analytics.holdRate}%
              </h2>

              <p className="mt-2 text-xs opacity-80">
                Requests currently on hold
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white shadow-lg">
              <p className="text-sm opacity-90">Leave Utilization</p>

              <h2 className="mt-2 text-3xl font-bold">
                {analytics.utilizationRate}%
              </h2>

              <p className="mt-2 text-xs opacity-80">
                Pending + Approved Requests
              </p>
            </div>

          </div>

          {/* Search & Filters */}

          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row">

              <input
                type="text"
                placeholder="Search employee, leave type or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="manager_approved">Manager Approved</option>
                <option value="approved">Approved</option>
                <option value="hold">Hold</option>
                <option value="rejected">Rejected</option>
              </select>

            </div>
          </div>

                    {/* ================= TABLE START ================= */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-800">
                Leave Requests
              </h3>

              <p className="text-sm text-slate-500">
                Total {filteredLeaveRequests.length} leave request(s)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Leave Details</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Current Level</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Applied On</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700"></div>
                          <p className="text-slate-500">
                            Loading leave requests...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="text-6xl">🌴</div>

                          <h3 className="text-lg font-semibold text-slate-700">
                            No Leave Requests Found
                          </h3>

                          <p className="text-sm text-slate-500">
                            Try changing your search or filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaveRequests.map((leave) => (
                      <tr
                        key={leave.id}
                        className="transition duration-200 hover:bg-slate-50"
                      >
                        {/* Employee */}

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                              {leave.requested_by_name?.charAt(0) || "U"}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {leave.requested_by_name}
                              </p>

                              <p className="text-xs capitalize text-slate-500">
                                {leave.requested_by_role || "Employee"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Leave Type */}

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {leave.leave_type}
                          </span>

                          <p className="mt-2 max-w-xs text-sm text-slate-600 line-clamp-2">
                            {leave.reason}
                          </p>
                        </td>

                        {/* Duration */}

                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-800">
                            {leave.start_date}
                          </p>

                          <p className="text-sm text-slate-500">
                            to {leave.end_date}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {leave.days} Day(s)
                          </p>
                        </td>

                        {/* Current Level */}

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getLevelBadge(
                              leave.current_level
                            )}`}
                          >
                            {getLevelText(leave.current_level)}
                          </span>
                        </td>

                        {/* Status */}

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                              leave.status
                            )}`}
                          >
                            {getStatusText(leave.status)}
                          </span>
                        </td>

                        {/* Created Date */}

                        <td className="px-6 py-5">
                          <p className="text-sm text-slate-700">
                            {new Date(leave.created_at).toLocaleDateString(
                              "en-GB"
                            )}
                          </p>

                          <p className="text-xs text-slate-500">
                            {new Date(leave.created_at).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </td>

                        {/* Actions */}

                        <td className="px-6 py-5">
                          <div className="flex flex-wrap justify-center gap-2">

                            {/* Manager Pending */}

                            {isManager &&
                              leave.current_level === "manager" &&
                              leave.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("approve");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                  >
                                    ✅ Approve
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("hold");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                                  >
                                    ⏸ Hold
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("reject");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                                  >
                                    ❌ Reject
                                  </button>
                                </>
                              )}

                            {/* Manager Hold */}

                            {isManager &&
                              leave.current_level === "manager" &&
                              leave.status === "hold" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("resume");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                  >
                                    ▶ Resume
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("approve");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                  >
                                    ✅ Approve
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("reject");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                                  >
                                    ❌ Reject
                                  </button>
                                </>
                              )}

                            {/* Admin Review */}

                            {isAdmin &&
                              leave.current_level === "admin" &&
                              (leave.status === "manager_approved" ||
                                leave.status === "hold") && (
                                <>
                                  {leave.status === "hold" && (
                                    <button
                                      onClick={() => {
                                        setSelectedLeave(leave);
                                        setActionType("resume");
                                        setShowActionModal(true);
                                      }}
                                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                      ▶ Resume
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("approve");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                  >
                                    ✅ Final Approve
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("hold");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                                  >
                                    ⏸ Hold
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setActionType("reject");
                                      setShowActionModal(true);
                                    }}
                                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                                  >
                                    ❌ Reject
                                  </button>
                                </>
                              )}

                            {/* Completed */}

                            {(leave.status === "approved" ||
                              leave.status === "rejected") && (
                              <span className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700">
                                Completed
                              </span>
                            )}

                            {/* Employee */}

                            {isEmployee &&
                              leave.status !== "approved" &&
                              leave.status !== "rejected" && (
                                <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                                  View Only
                                </span>
                              )}

                            {/* History Button */}

                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setShowHistoryModal(true);
                              }}
                              className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              📜 History
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

                    {/* ================= MONTHLY TREND + PIE CHART ================= */}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* Monthly Leave Trend */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Monthly Leave Trend
                  </h2>

                  <p className="text-sm text-slate-500">
                    Leave requests created this year.
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  2026
                </span>
              </div>

              <svg viewBox="0 0 420 180" className="w-full">

                {[30, 60, 90, 120, 150].map((y) => (
                  <line
                    key={y}
                    x1="30"
                    y1={y}
                    x2="395"
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                  />
                ))}

                <polyline
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  points={monthlyTrend
                    .map((item, index) => {
                      const x = 35 + index * 31;
                      const y = 150 - item.count * 8;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                {monthlyTrend.map((item, index) => {
                  const x = 35 + index * 31;
                  const y = 150 - item.count * 8;

                  return (
                    <g key={item.month}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#2563EB"
                      />

                      <text
                        x={x}
                        y="170"
                        fontSize="10"
                        textAnchor="middle"
                        fill="#64748B"
                      >
                        {item.month}
                      </text>

                      <text
                        x={x}
                        y={y - 10}
                        fontSize="10"
                        textAnchor="middle"
                        fill="#2563EB"
                      >
                        {item.count}
                      </text>
                    </g>
                  );
                })}

              </svg>
            </div>

            {/* Leave Status Distribution */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Leave Status Distribution
                </h2>

                <p className="text-sm text-slate-500">
                  Overall leave request percentage.
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">

                <svg viewBox="0 0 180 180" className="h-52 w-52">

                  <circle
                    cx="90"
                    cy="90"
                    r="65"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="18"
                    strokeDasharray={`${pieData[0].percent * 4} 400`}
                    strokeDashoffset="0"
                    transform="rotate(-90 90 90)"
                  />

                  <circle
                    cx="90"
                    cy="90"
                    r="65"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="18"
                    strokeDasharray={`${pieData[1].percent * 4} 400`}
                    strokeDashoffset={`-${pieData[0].percent * 4}`}
                    transform="rotate(-90 90 90)"
                  />

                  <circle
                    cx="90"
                    cy="90"
                    r="65"
                    fill="none"
                    stroke="#9333EA"
                    strokeWidth="18"
                    strokeDasharray={`${pieData[2].percent * 4} 400`}
                    strokeDashoffset={`-${(pieData[0].percent + pieData[1].percent) * 4}`}
                    transform="rotate(-90 90 90)"
                  />

                  <circle
                    cx="90"
                    cy="90"
                    r="65"
                    fill="none"
                    stroke="#DC2626"
                    strokeWidth="18"
                    strokeDasharray={`${pieData[3].percent * 4} 400`}
                    strokeDashoffset={`-${(pieData[0].percent + pieData[1].percent + pieData[2].percent) * 4}`}
                    transform="rotate(-90 90 90)"
                  />

                  <text
                    x="90"
                    y="88"
                    textAnchor="middle"
                    fontSize="22"
                    fill="#0F172A"
                    fontWeight="700"
                  >
                    {dashboard.total}
                  </text>

                  <text
                    x="90"
                    y="108"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#64748B"
                  >
                    Total Leaves
                  </text>

                </svg>

                <div className="space-y-3">

                  {pieData.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3"
                    >
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>

                      <div className="flex w-40 justify-between text-sm">
                        <span>{item.label}</span>

                        <span className="font-semibold">
                          {item.percent}%
                        </span>
                      </div>
                    </div>
                  ))}

                </div>

              </div>
            </div>

          </div>

          {/* ================= MANAGER / ADMIN ANALYTICS ================= */}

          <div className="mt-8 grid gap-5 md:grid-cols-3">

            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white shadow-lg">
              <p className="text-sm opacity-80">
                Waiting for Manager Review
              </p>

              <h2 className="mt-3 text-4xl font-bold">
                {leaveRequests.filter(
                  (leave) =>
                    leave.current_level === "manager" &&
                    leave.status === "pending"
                ).length}
              </h2>

              <p className="mt-2 text-xs opacity-80">
                Pending manager approvals
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white shadow-lg">
              <p className="text-sm opacity-80">
                Waiting for Admin Review
              </p>

              <h2 className="mt-3 text-4xl font-bold">
                {leaveRequests.filter(
                  (leave) =>
                    leave.current_level === "admin" &&
                    leave.status === "manager_approved"
                ).length}
              </h2>

              <p className="mt-2 text-xs opacity-80">
                Waiting for final approval
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-green-600 to-green-700 p-5 text-white shadow-lg">
              <p className="text-sm opacity-80">
                Completed Today
              </p>

              <h2 className="mt-3 text-4xl font-bold">
                {leaveRequests.filter((leave) => {
                  if (!leave.updated_at) return false;

                  return (
                    new Date(leave.updated_at).toLocaleDateString("en-CA") ===
                      new Date().toLocaleDateString("en-CA") &&
                    leave.status === "approved"
                  );
                }).length}
              </h2>

              <p className="mt-2 text-xs opacity-80">
                Final approved today
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                This Month Requests
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {leaveRequests.filter((leave) => {
                  if (!leave.created_at) return false;

                  const created = new Date(leave.created_at);
                  const now = new Date();

                  return (
                    created.getMonth() === now.getMonth() &&
                    created.getFullYear() === now.getFullYear()
                  );
                }).length}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Top Leave Type
              </p>

              <h2 className="mt-3 text-2xl font-bold text-blue-700">
                {analytics.topLeaveType}
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Most requested leave category
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Team Leave Summary
              </p>

              <div className="mt-4 space-y-3 text-sm">

                <div className="flex justify-between">
                  <span>Approved</span>

                  <span className="font-semibold text-green-600">
                    {dashboard.approved}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Pending</span>

                  <span className="font-semibold text-yellow-600">
                    {dashboard.pending}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Hold</span>

                  <span className="font-semibold text-purple-600">
                    {dashboard.hold}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Rejected</span>

                  <span className="font-semibold text-red-600">
                    {dashboard.rejected}
                  </span>
                </div>

              </div>
            </div>

          </div>

                    {/* ================= RECENT LEAVE ACTIVITY ================= */}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Leave Activity
                </h2>

                <p className="text-sm text-slate-500">
                  Latest leave requests across your team.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Live Activity
              </span>
            </div>

            <div className="space-y-4">

              {leaveRequests.slice(0, 5).map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                      {leave.requested_by_name?.charAt(0) || "U"}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {leave.requested_by_name}
                      </h4>

                      <p className="text-sm text-slate-500">
                        {leave.leave_type} • {leave.days} Day(s)
                      </p>

                      <p className="text-xs text-slate-400">
                        {leave.start_date} → {leave.end_date}
                      </p>
                    </div>

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                      leave.status
                    )}`}
                  >
                    {getStatusText(leave.status)}
                  </span>
                </div>
              ))}

            </div>

          </div>

          {/* ================= QUICK STATS ================= */}

          <div className="mt-8 grid gap-5 md:grid-cols-4">

            <div className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 p-5 text-white shadow-lg">
              <p className="text-sm opacity-80">Total Employees on Leave</p>

              <h2 className="mt-3 text-3xl font-bold">
                {dashboard.pending + dashboard.approved}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 p-5 text-white shadow-lg">
              <p className="text-sm opacity-80">Approval Success Rate</p>

              <h2 className="mt-3 text-3xl font-bold">
                {analytics.approvalRate}%
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-5 text-white shadow-lg">
              <p className="text-sm opacity-80">Rejected Requests</p>

              <h2 className="mt-3 text-3xl font-bold">
                {dashboard.rejected}
              </h2>
            </div>

            <div className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 p-5 text-white shadow-lg">
              <p className="text-sm opacity-80">Pending Reviews</p>

              <h2 className="mt-3 text-3xl font-bold">
                {dashboard.pending + dashboard.hold}
              </h2>
            </div>

          </div>

          {/* ================= MODALS ================= */}

          {showCreateModal && (
            <CreateLeaveModal
              closeModal={() => setShowCreateModal(false)}
              refreshLeaveRequests={fetchLeaveRequests}
            />
          )}

          {showActionModal && selectedLeave && (
            <LeaveActionModal
              leave={selectedLeave}
              actionType={actionType}
              closeModal={() => {
                setShowActionModal(false);
                setSelectedLeave(null);
                setActionType("");
              }}
              refreshLeaveRequests={fetchLeaveRequests}
            />
          )}

          {showHistoryModal && selectedLeave && (
            <LeaveHistoryModal
              leave={selectedLeave}
              closeModal={() => {
                setShowHistoryModal(false);
                setSelectedLeave(null);
              }}
            />
          )}

        </main>
      </div>
    </div>
  );
}

export default LeaveRequests;
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import CreateApprovalModal from "../components/CreateApprovalModal";
import ApprovalActionModal from "../components/ApprovalActionModal";
import ApprovalHistoryModal from "../components/ApprovalHistoryModal";

import { getAllApprovals } from "../services/approvalService";
import { getUserFromToken } from "../utils/jwt";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

function Approvals() {
const currentUser = getUserFromToken();

// Normalize role from JWT
const userRole = (currentUser?.role || "").trim().toLowerCase();

console.log("Current User:", currentUser);
console.log("User Role:", userRole);

const isAdmin = userRole === "admin";
const isManager = userRole === "manager";
const isEmployee = userRole === "employee";

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);

      const data = await getAllApprovals();
      setApprovals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Approval Fetch Error:", error);
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEARCH FILTER ================= */

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const keyword = search.toLowerCase();

      const titleMatch =
        approval.title?.toLowerCase().includes(keyword) ||
        approval.description?.toLowerCase().includes(keyword) ||
        approval.requested_by_name?.toLowerCase().includes(keyword);

      const statusMatch =
        statusFilter === "all"
          ? true
          : approval.status === statusFilter;

      return titleMatch && statusMatch;
    });
  }, [approvals, search, statusFilter]);

  /* ================= DASHBOARD ================= */

  const dashboard = useMemo(() => {
    return {
      total: approvals.length,

      pending: approvals.filter(
        (a) => a.status === "pending"
      ).length,

      hold: approvals.filter(
        (a) => a.status === "hold"
      ).length,

      approved: approvals.filter(
        (a) =>
          a.status === "approved" ||
          a.status === "manager_approved"
      ).length,

      rejected: approvals.filter(
        (a) => a.status === "rejected"
      ).length,

      managerReview: approvals.filter(
        (a) =>
          a.current_level === "manager" &&
          a.status === "pending"
      ).length,

      adminReview: approvals.filter(
        (a) =>
          a.current_level === "admin" &&
          a.status === "manager_approved"
      ).length,
    };
  }, [approvals]);

  /* ================= ANALYTICS ================= */

  const analytics = useMemo(() => {
    const total = dashboard.total || 1;

    return {
      completionRate: Math.round(
        ((dashboard.approved + dashboard.rejected) / total) * 100
      ),

      approvalRate: Math.round(
        (dashboard.approved / total) * 100
      ),

      pendingRate: Math.round(
        (dashboard.pending / total) * 100
      ),

      holdRate: Math.round(
        (dashboard.hold / total) * 100
      ),

      rejectionRate: Math.round(
        (dashboard.rejected / total) * 100
      ),
    };
  }, [dashboard]);

  /* ================= PIE DATA ================= */

  const pieData = [
    {
      name: "Approved",
      value: dashboard.approved,
      color: "#16A34A",
    },
    {
      name: "Pending",
      value: dashboard.pending,
      color: "#F59E0B",
    },
    {
      name: "Hold",
      value: dashboard.hold,
      color: "#9333EA",
    },
    {
      name: "Rejected",
      value: dashboard.rejected,
      color: "#DC2626",
    },
  ];

  /* ================= MONTHLY TREND ================= */

  const trendData = useMemo(() => {
    const months = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];

    const monthlyMap = {};

    approvals.forEach((item) => {
      if (!item.created_at) return;

      const month = months[new Date(item.created_at).getMonth()];
      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });

    return months.map((month) => ({
      month,
      requests: monthlyMap[month] || 0,
    }));
  }, [approvals]);

  /* ================= RECENT ACTIVITY ================= */

  const recentActivities = useMemo(() => {
    return [...approvals]
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
      .slice(0, 5);
  }, [approvals]);

  /* ================= STATUS BADGE ================= */

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
      case "approved":
        return "Approved";

      case "manager_approved":
        return "Manager Approved";

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

  /* ================= LEVEL BADGE ================= */

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

  return (
        <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">

          {/* ================= HEADER ================= */}

          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Approval Management
              </h1>

              <p className="mt-2 text-slate-500">
                Enterprise Approval Workflow Dashboard
              </p>
            </div>

            {isEmployee && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-lg hover:bg-blue-800"
              >
                + New Approval
              </button>
            )}
          </div>

          {/* ================= ENTERPRISE DASHBOARD CARDS ================= */}

          <div className="mb-8 grid gap-5 lg:grid-cols-5">

            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-xl">
              <p className="text-sm text-blue-100">TOTAL REQUESTS</p>

              <h2 className="mt-3 text-4xl font-bold">{dashboard.total}</h2>

              <p className="mt-4 text-xs text-blue-100">
                Company approval requests.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 p-5 text-white shadow-xl">
              <p className="text-sm text-yellow-50">PENDING</p>

              <h2 className="mt-3 text-4xl font-bold">{dashboard.pending}</h2>

              <p className="mt-4 text-xs text-yellow-50">
                Waiting for review.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-purple-500 to-violet-700 p-5 text-white shadow-xl">
              <p className="text-sm text-purple-100">ON HOLD</p>

              <h2 className="mt-3 text-4xl font-bold">{dashboard.hold}</h2>

              <p className="mt-4 text-xs text-purple-100">
                Need more information.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-700 p-5 text-white shadow-xl">
              <p className="text-sm text-green-100">APPROVED</p>

              <h2 className="mt-3 text-4xl font-bold">{dashboard.approved}</h2>

              <p className="mt-4 text-xs text-green-100">
                Successfully completed.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-red-500 to-red-700 p-5 text-white shadow-xl">
              <p className="text-sm text-red-100">REJECTED</p>

              <h2 className="mt-3 text-4xl font-bold">{dashboard.rejected}</h2>

              <p className="mt-4 text-xs text-red-100">
                Needs correction.
              </p>
            </div>

          </div>

          {/* ================= PROGRESS ANALYTICS ================= */}

          <div className="mb-8 grid gap-6 lg:grid-cols-2">

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                  Approval Progress
                </h2>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {analytics.completionRate}% Completed
                </span>
              </div>

              {[
                ["Approved", analytics.approvalRate, "bg-green-600", "bg-green-100"],
                ["Pending", analytics.pendingRate, "bg-yellow-500", "bg-yellow-100"],
                ["Hold", analytics.holdRate, "bg-purple-600", "bg-purple-100"],
                ["Rejected", analytics.rejectionRate, "bg-red-600", "bg-red-100"],
              ].map(([label, value, bar, bg]) => (
                <div className="mb-5" key={label}>
                  <div className="mb-2 flex justify-between text-sm font-medium text-slate-700">
                    <span>{label}</span>
                    <span>{value}%</span>
                  </div>

                  <div className={`h-2 overflow-hidden rounded-full ${bg}`}>
                    <div
                      className={`h-full rounded-full ${bar}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <h2 className="mb-5 text-xl font-bold text-slate-900">
                Analytics Summary
              </h2>

              <div className="space-y-4">

                <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
                  <div>
                    <p className="text-sm text-green-700">Approval Rate</p>

                    <h3 className="text-2xl font-bold text-green-700">
                      {analytics.approvalRate}%
                    </h3>
                  </div>

                  <span className="text-3xl">✅</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-yellow-50 p-4">
                  <div>
                    <p className="text-sm text-yellow-700">Pending Rate</p>

                    <h3 className="text-2xl font-bold text-yellow-700">
                      {analytics.pendingRate}%
                    </h3>
                  </div>

                  <span className="text-3xl">⏳</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-purple-50 p-4">
                  <div>
                    <p className="text-sm text-purple-700">Hold Rate</p>

                    <h3 className="text-2xl font-bold text-purple-700">
                      {analytics.holdRate}%
                    </h3>
                  </div>

                  <span className="text-3xl">⏸️</span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">
                  <div>
                    <p className="text-sm text-red-700">Rejection Rate</p>

                    <h3 className="text-2xl font-bold text-red-700">
                      {analytics.rejectionRate}%
                    </h3>
                  </div>

                  <span className="text-3xl">❌</span>
                </div>

              </div>
            </div>

          </div>

          {/* ================= SEARCH & FILTER ================= */}

          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row">

              <input
                type="text"
                placeholder="Search approval title, employee or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="manager_approved">Manager Approved</option>
                <option value="hold">Hold</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

            </div>
          </div>

          {/* ================= PIE CHART + TREND ================= */}

          <div className="mb-8 grid gap-6 lg:grid-cols-2">

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Approval Status Distribution
                </h2>

                <p className="text-sm text-slate-500">
                  Live approval status breakdown.
                </p>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={55}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>

                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />

                      <span className="text-sm font-medium text-slate-700">
                        {item.name}
                      </span>
                    </div>

                    <span className="font-bold text-slate-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  Monthly Approval Trend
                </h2>

                <p className="text-sm text-slate-500">
                  Requests created month-wise.
                </p>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="month" />

                    <YAxis allowDecimals={false} />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="requests"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  Total Requests This Year
                </p>

                <h3 className="mt-2 text-3xl font-bold text-blue-800">
                  {dashboard.total}
                </h3>

                <p className="mt-2 text-xs text-blue-600">
                  Trend updates automatically when new approvals are created.
                </p>
              </div>
            </div>

          </div>
          {/* ================= APPROVAL REQUESTS TABLE ================= */}

<div className="overflow-hidden rounded-3xl bg-white shadow-md">
  <div className="border-b border-slate-200 px-6 py-4">
    <h2 className="text-xl font-bold text-slate-900">
      Approval Requests
    </h2>

    <p className="text-sm text-slate-500">
      Enterprise Manager → Admin Approval Workflow
    </p>
  </div>

  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead className="bg-slate-100">
        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <th className="px-6 py-4">Employee</th>
          <th className="px-6 py-4">Approval Details</th>
          <th className="px-6 py-4">Current Level</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Requested On</th>
          <th className="px-6 py-4 text-center">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-200">
        {loading ? (
          <tr>
            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
              Loading approval requests...
            </td>
          </tr>
        ) : filteredApprovals.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
              No approval requests found.
            </td>
          </tr>
        ) : (
          filteredApprovals.map((approval) => (
            <tr key={approval.id} className="transition hover:bg-slate-50">

              {/* Employee */}

              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                    {approval.requested_by_name?.charAt(0) || "U"}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {approval.requested_by_name}
                    </p>

                    <p className="text-xs capitalize text-slate-500">
                      {approval.requested_by_role || "Employee"}
                    </p>
                  </div>
                </div>
              </td>

              {/* Approval */}

              <td className="px-6 py-5">
                <p className="font-semibold text-slate-900">
                  {approval.title}
                </p>

                <p className="mt-1 max-w-xs text-sm text-slate-500 line-clamp-2">
                  {approval.description}
                </p>
              </td>

              {/* Current Level */}

              <td className="px-6 py-5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    approval.current_level === "manager"
                      ? "bg-blue-100 text-blue-700"
                      : approval.current_level === "admin"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {approval.current_level === "manager"
                    ? "Manager Review"
                    : approval.current_level === "admin"
                    ? "Admin Review"
                    : "Completed"}
                </span>
              </td>

              {/* Status */}

              <td className="px-6 py-5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    approval.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : approval.status === "manager_approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : approval.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : approval.status === "hold"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {approval.status === "manager_approved"
                    ? "Manager Approved"
                    : approval.status}
                </span>
              </td>

              {/* Date */}

              <td className="px-6 py-5">
                <p className="text-sm text-slate-700">
                  {new Date(approval.created_at).toLocaleDateString("en-GB")}
                </p>

                <p className="text-xs text-slate-500">
                  {new Date(approval.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </td>

              {/* ================= ACTION BUTTONS ================= */}
{/* ================= ACTION BUTTONS ================= */}

<td className="px-6 py-5">
  <div className="flex flex-wrap justify-center gap-2">

    {/* MANAGER */}
    {isManager &&
      approval.current_level === "manager" &&
      ["pending", "hold"].includes(approval.status) && (
        <>
          {approval.status === "hold" && (
            <button
              onClick={() => {
                setSelectedApproval(approval);
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
              setSelectedApproval(approval);
              setActionType("approve");
              setShowActionModal(true);
            }}
            className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
          >
            ✅ Approve
          </button>

          <button
            onClick={() => {
              setSelectedApproval(approval);
              setActionType("hold");
              setShowActionModal(true);
            }}
            className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
          >
            ⏸ Hold
          </button>

          <button
            onClick={() => {
              setSelectedApproval(approval);
              setActionType("reject");
              setShowActionModal(true);
            }}
            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
          >
            ❌ Reject
          </button>
        </>
      )}

    {/* ADMIN */}
   {isAdmin &&
  (
    (approval.current_level?.toLowerCase() === "manager" &&
      approval.status?.toLowerCase() === "pending") ||
    (approval.current_level?.toLowerCase() === "admin" &&
      ["manager_approved", "hold"].includes(
        approval.status?.toLowerCase()
      ))
  ) && (
    <>
      {approval.status?.toLowerCase() === "hold" && (
        <button
          onClick={() => {
            setSelectedApproval(approval);
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
          setSelectedApproval(approval);
          setActionType("approve");
          setShowActionModal(true);
        }}
        className="rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-800"
      >
        ✅ Final Approve
      </button>

      <button
        onClick={() => {
          setSelectedApproval(approval);
          setActionType("hold");
          setShowActionModal(true);
        }}
        className="rounded-lg bg-purple-700 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-800"
      >
        ⏸ Hold
      </button>

      <button
        onClick={() => {
          setSelectedApproval(approval);
          setActionType("reject");
          setShowActionModal(true);
        }}
        className="rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
      >
        ❌ Reject
      </button>
    </>
)}
        

    {/* EMPLOYEE */}
    {isEmployee &&
      !["approved", "rejected"].includes(approval.status) && (
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
          Waiting for Approval
        </span>
      )}

    {["approved", "rejected"].includes(approval.status) && (
      <span className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700">
        Completed
      </span>
    )}

    <button
      onClick={() => {
        setSelectedApproval(approval);
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
{/* ================= CREATE APPROVAL MODAL ================= */}

{showCreateModal && (
  <CreateApprovalModal
    closeModal={() => setShowCreateModal(false)}
    refreshApprovals={fetchApprovals}
  />
)}

{/* ================= APPROVAL ACTION MODAL ================= */}

{showActionModal && selectedApproval && (
  <ApprovalActionModal
    approval={selectedApproval}
    actionType={actionType}
    closeModal={() => {
      setShowActionModal(false);
      setSelectedApproval(null);
      setActionType("");
    }}
    refreshApprovals={fetchApprovals}
  />
)}

{/* ================= APPROVAL HISTORY MODAL ================= */}

{showHistoryModal && selectedApproval && (
  <ApprovalHistoryModal
    approval={selectedApproval}
    closeModal={() => {
      setShowHistoryModal(false);
      setSelectedApproval(null);
    }}
  />
)}
        </main>
      </div>
    </div>
  );
}

export default Approvals;
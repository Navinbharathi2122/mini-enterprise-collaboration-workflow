
import { useCallback, useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import CreateApprovalModal from "../components/CreateApprovalModal";
import ApprovalActionModal from "../components/ApprovalActionModal";
import ApprovalHistoryModal from "../components/ApprovalHistoryModal";

import api from "../services/axios";
import { getAllApprovals } from "../services/approvalService";

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
  // ---------------- USER ----------------

  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState("");

  const userRole = (currentUser?.role || "")
    .trim()
    .toLowerCase();

  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";
  const isEmployee = userRole === "employee";

  // ---------------- APPROVALS ----------------

  const [approvals, setApprovals] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // ---------------- FETCH CURRENT USER ----------------

  const loadCurrentUser = useCallback(async () => {
    try {
      setUserLoading(true);
      setUserError("");

      const response = await api.get("/users/me");

      setCurrentUser(response.data);
    } catch (error) {
      console.error("Current user error:", error);

      setCurrentUser(null);

      setUserError(
        error.response?.data?.detail ||
          "Unable to load your user details. Please log in again."
      );
    } finally {
      setUserLoading(false);
    }
  }, []);

  // ---------------- FETCH APPROVALS ----------------

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const data = await getAllApprovals(page, 20, statusFilter);
      const rows = Array.isArray(data) ? data : [];
      setApprovals(rows);
      setHasNextPage(rows.length === 20);
    } catch (error) {
      console.error("Approval fetch error:", error);

      setApprovals([]);

      setPageError(
        error.response?.data?.detail ||
          "Unable to load approval requests."
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    if (userLoading) return;

    if (!currentUser) {
      setApprovals([]);
      setLoading(false);
      return;
    }

    fetchApprovals();
  }, [userLoading, currentUser, fetchApprovals]);

  // ---------------- SEARCH AND FILTER ----------------

  const filteredApprovals = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return approvals.filter((approval) => {
      const titleMatch = (approval.title || "")
        .toLowerCase()
        .includes(keyword);

      const descriptionMatch = (approval.description || "")
        .toLowerCase()
        .includes(keyword);

      const requesterMatch = (approval.requested_by_name || "")
        .toLowerCase()
        .includes(keyword);

      const searchMatch =
        !keyword ||
        titleMatch ||
        descriptionMatch ||
        requesterMatch;

      const statusMatch =
        statusFilter === "all" ||
        (approval.status || "").toLowerCase() === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [approvals, search, statusFilter]);

  // ---------------- DASHBOARD STATISTICS ----------------

  const dashboard = useMemo(() => {
    const pending = approvals.filter(
      (item) => item.status === "pending"
    ).length;

    const hold = approvals.filter(
      (item) => item.status === "hold"
    ).length;

    const approved = approvals.filter(
      (item) =>
        item.status === "approved" ||
        item.status === "manager_approved"
    ).length;

    const rejected = approvals.filter(
      (item) => item.status === "rejected"
    ).length;

    return {
      total: approvals.length,
      pending,
      hold,
      approved,
      rejected,

      managerReview: approvals.filter(
        (item) =>
          item.current_level === "manager" &&
          ["pending", "hold"].includes(item.status)
      ).length,

      // Admin review includes direct manager requests
      // that are pending at the admin level.
      adminReview: approvals.filter(
        (item) =>
          item.current_level === "admin" &&
          ["pending", "manager_approved", "hold"].includes(
            item.status
          )
      ).length,
    };
  }, [approvals]);

  const analytics = useMemo(() => {
    const total = dashboard.total;

    const percentage = (value) =>
      total === 0 ? 0 : Math.round((value / total) * 100);

    return {
      approvalRate: percentage(dashboard.approved),
      pendingRate: percentage(dashboard.pending),
      holdRate: percentage(dashboard.hold),
      rejectionRate: percentage(dashboard.rejected),

      completionRate: percentage(
        dashboard.approved + dashboard.rejected
      ),
    };
  }, [dashboard]);

  // ---------------- CHART DATA ----------------

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
      name: "On Hold",
      value: dashboard.hold,
      color: "#9333EA",
    },
    {
      name: "Rejected",
      value: dashboard.rejected,
      color: "#DC2626",
    },
  ];

  const trendData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthlyMap = {};

    approvals.forEach((approval) => {
      if (!approval.created_at) return;

      const date = new Date(approval.created_at);

      if (Number.isNaN(date.getTime())) return;

      const month = months[date.getMonth()];

      monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });

    return months.map((month) => ({
      month,
      requests: monthlyMap[month] || 0,
    }));
  }, [approvals]);


  // ---------------- STATUS HELPERS ----------------

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      manager_approved: "bg-emerald-100 text-emerald-800",
      approved: "bg-green-100 text-green-800",
      hold: "bg-purple-100 text-purple-800",
      rejected: "bg-red-100 text-red-800",
    };

    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusText = (status) => {
    const labels = {
      pending: "Pending",
      manager_approved: "Manager Approved",
      approved: "Approved",
      hold: "On Hold",
      rejected: "Rejected",
    };

    return labels[status] || status || "Unknown";
  };

  const getLevelText = (level) => {
    const labels = {
      manager: "Manager Review",
      admin: "Admin Review",
      completed: "Completed",
    };

    return labels[level] || level || "Unknown";
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-GB");
  };

  const formatTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------------- ACTION PERMISSIONS ----------------

  const canManagerAct = (approval) =>
    isManager &&
    approval.current_level === "manager" &&
    ["pending", "hold"].includes(approval.status) &&
    (approval.requested_by_role || "").toLowerCase() === "employee";

  const canAdminAct = (approval) =>
    isAdmin &&
    approval.current_level === "admin" &&
    ["pending", "manager_approved", "hold"].includes(
      approval.status
    );

  // ---------------- MODAL HANDLERS ----------------

  const openActionModal = (approval, action) => {
    setSelectedApproval(approval);
    setActionType(action);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedApproval(null);
    setActionType("");
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedApproval(null);
  };

  const handleCreateSuccess = async () => {
    setShowCreateModal(false);
    await fetchApprovals();
  };

  // ---------------- LOADING STATE ----------------

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-xl bg-white p-8 text-center shadow">
          <p className="text-lg font-semibold text-slate-700">
            Loading your user details...
          </p>
        </div>
      </div>
    );
  }

  // ---------------- MAIN PAGE ----------------

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* HEADER */}

          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Approval Management
              </h1>

              <p className="mt-2 text-slate-500">
                Enterprise Approval Workflow Dashboard
              </p>

              {currentUser && (
                <p className="mt-2 text-sm text-slate-600">
                  Logged-in role:{" "}
                  <span className="font-semibold capitalize">
                    {userRole}
                  </span>
                </p>
              )}
            </div>

            {currentUser && (isEmployee || isManager) && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-lg hover:bg-blue-800"
              >
                + New Approval
              </button>
            )}
          </div>

          {/* ERROR MESSAGES */}

          {(userError || pageError) && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <p>{userError || pageError}</p>

              <button
                type="button"
                onClick={userError ? loadCurrentUser : fetchApprovals}
                className="mt-2 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {!currentUser ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow">
              <p className="text-slate-700">
                Your user details could not be loaded.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Check your login session and Auth0 token configuration.
              </p>
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}

              <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                  title="Total Requests"
                  value={dashboard.total}
                  description="All visible requests"
                  color="from-blue-600 to-blue-800"
                />

                <SummaryCard
                  title="Pending"
                  value={dashboard.pending}
                  description="Waiting for review"
                  color="from-yellow-400 to-orange-500"
                />

                <SummaryCard
                  title="On Hold"
                  value={dashboard.hold}
                  description="Need more information"
                  color="from-purple-500 to-violet-700"
                />

                <SummaryCard
                  title="Approved"
                  value={dashboard.approved}
                  description="Approved requests"
                  color="from-green-500 to-emerald-700"
                />

                <SummaryCard
                  title="Rejected"
                  value={dashboard.rejected}
                  description="Rejected requests"
                  color="from-red-500 to-red-700"
                />
              </div>

              {/* WORKFLOW COUNTS */}

              <div className="mb-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow">
                  <p className="text-sm text-slate-500">
                    Waiting for Manager
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-blue-700">
                    {dashboard.managerReview}
                  </h2>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow">
                  <p className="text-sm text-slate-500">
                    Waiting for Admin
                  </p>

                  <h2 className="mt-2 text-3xl font-bold text-indigo-700">
                    {dashboard.adminReview}
                  </h2>
                </div>
              </div>

              
              {/* ANALYTICS */}

              <div className="mb-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl bg-white p-6 shadow">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-slate-900">
                      Approval Progress
                    </h2>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      {analytics.completionRate}% Completed
                    </span>
                  </div>

                  {[
                    {
                      label: "Approved",
                      value: analytics.approvalRate,
                      bar: "bg-green-600",
                      bg: "bg-green-100",
                    },
                    {
                      label: "Pending",
                      value: analytics.pendingRate,
                      bar: "bg-yellow-500",
                      bg: "bg-yellow-100",
                    },
                    {
                      label: "On Hold",
                      value: analytics.holdRate,
                      bar: "bg-purple-600",
                      bg: "bg-purple-100",
                    },
                    {
                      label: "Rejected",
                      value: analytics.rejectionRate,
                      bar: "bg-red-600",
                      bg: "bg-red-100",
                    },
                  ].map((item) => (
                    <div className="mb-5" key={item.label}>
                      <div className="mb-2 flex justify-between text-sm font-medium text-slate-700">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>

                      <div
                        className={`h-2 overflow-hidden rounded-full ${item.bg}`}
                      >
                        <div
                          className={`h-full rounded-full ${item.bar}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl bg-white p-6 shadow">
                  <h2 className="mb-5 text-xl font-bold text-slate-900">
                    Analytics Summary
                  </h2>

                  <div className="space-y-4">
                    {[
                      {
                        label: "Approval Rate",
                        value: analytics.approvalRate,
                        icon: "✅",
                        style: "bg-green-50 text-green-700",
                      },
                      {
                        label: "Pending Rate",
                        value: analytics.pendingRate,
                        icon: "⏳",
                        style: "bg-yellow-50 text-yellow-700",
                      },
                      {
                        label: "On Hold Rate",
                        value: analytics.holdRate,
                        icon: "⏸️",
                        style: "bg-purple-50 text-purple-700",
                      },
                      {
                        label: "Rejection Rate",
                        value: analytics.rejectionRate,
                        icon: "❌",
                        style: "bg-red-50 text-red-700",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center justify-between rounded-xl p-4 ${item.style}`}
                      >
                        <div>
                          <p className="text-sm">{item.label}</p>
                          <h3 className="mt-1 text-2xl font-bold">
                            {item.value}%
                          </h3>
                        </div>

                        <span className="text-3xl">{item.icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CHARTS */}

              <div className="mb-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl bg-white p-6 shadow">
                  <h2 className="mb-2 text-xl font-bold text-slate-900">
                    Approval Status Distribution
                  </h2>

                  <p className="text-sm text-slate-500">
                    Breakdown of visible approval requests.
                  </p>

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
                          {pieData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>

                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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

                          <span className="text-sm text-slate-700">
                            {item.name}
                          </span>
                        </div>

                        <span className="font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow">
                  <h2 className="mb-2 text-xl font-bold text-slate-900">
                    Monthly Approval Trend
                  </h2>

                  <p className="text-sm text-slate-500">
                    Requests grouped by month.
                  </p>

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
                          name="Requests"
                          stroke="#2563EB"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 rounded-xl bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">
                      Total Visible Requests
                    </p>

                    <h3 className="mt-1 text-3xl font-bold text-blue-800">
                      {dashboard.total}
                    </h3>
                  </div>
                </div>
              </div>

              {/* SEARCH AND FILTER */}

              <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row">
                  <input
                    type="text"
                    placeholder="Search title, employee or description..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600"
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="manager_approved">
                      Manager Approved
                    </option>
                    <option value="hold">On Hold</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* APPROVAL TABLE */}

              <div className="overflow-hidden rounded-3xl bg-white shadow-md">
                <div className="border-b border-slate-200 px-6 py-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    Approval Requests
                  </h2>

                  <p className="text-sm text-slate-500">
                    Employee → Manager → Admin workflow
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[950px] w-full">
                    <thead className="bg-slate-100">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <th className="px-5 py-4">Employee</th>
                        <th className="px-5 py-4">Approval Details</th>
                        <th className="px-5 py-4">Current Level</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Requested On</th>
                        <th className="px-5 py-4 text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-slate-500"
                          >
                            Loading approval requests...
                          </td>
                        </tr>
                      ) : filteredApprovals.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-12 text-center text-slate-500"
                          >
                            No approval requests found.
                          </td>
                        </tr>
                      ) : (
                        filteredApprovals.map((approval) => {
                          const managerCanAct =
                            canManagerAct(approval);

                          const adminCanAct =
                            canAdminAct(approval);

                          const canAct =
                            managerCanAct || adminCanAct;

                          const isCompleted = [
                            "approved",
                            "rejected",
                          ].includes(approval.status);

                          return (
                            <tr
                              key={approval.id}
                              className="transition hover:bg-slate-50"
                            >
                              <td className="px-5 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                                    {(
                                      approval.requested_by_name || "U"
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-900">
                                      {approval.requested_by_name ||
                                        "Unknown User"}
                                    </p>

                                    <p className="text-xs capitalize text-slate-500">
                                      {approval.requested_by_role ||
                                        "employee"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-5">
                                <p className="font-semibold text-slate-900">
                                  {approval.title}
                                </p>

                                <p className="mt-1 max-w-xs whitespace-pre-wrap break-words text-sm text-slate-500">
                                  {approval.description || "No description"}
                                </p>
                              </td>

                              <td className="px-5 py-5">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                  {getLevelText(approval.current_level)}
                                </span>
                              </td>

                              <td className="px-5 py-5">
                                <span
                                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                                    approval.status
                                  )}`}
                                >
                                  {getStatusText(approval.status)}
                                </span>
                              </td>

                              <td className="px-5 py-5">
                                <p className="text-sm text-slate-700">
                                  {formatDate(approval.created_at)}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {formatTime(approval.created_at)}
                                </p>
                              </td>

                              <td className="px-5 py-5">
                                <div className="flex flex-wrap justify-center gap-2">
                                  {canAct && (
                                    <>
                                      {approval.status === "hold" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openActionModal(
                                              approval,
                                              "resume"
                                            )
                                          }
                                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                        >
                                          Resume
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openActionModal(
                                            approval,
                                            "approve"
                                          )
                                        }
                                        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                      >
                                        {adminCanAct
                                          ? "Final Approve"
                                          : "Approve"}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openActionModal(
                                            approval,
                                            "hold"
                                          )
                                        }
                                        className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                                      >
                                        Hold
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          openActionModal(
                                            approval,
                                            "reject"
                                          )
                                        }
                                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}

                                  {isEmployee && !isCompleted && (
                                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                                      Waiting for Approval
                                    </span>
                                  )}

                                  {isCompleted && (
                                    <span className="rounded-lg bg-green-100 px-3 py-2 text-xs font-semibold text-green-700">
                                      Completed
                                    </span>
                                  )}

                                  {!canAct &&
                                    !isEmployee &&
                                    !isCompleted && (
                                      <span className="text-xs text-slate-400">
                                        No action available
                                      </span>
                                    )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedApproval(approval);
                                      setShowHistoryModal(true);
                                    }}
                                    className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                  >
                                    History
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* REFRESH BUTTON */}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Page {page} · Showing {filteredApprovals.length} of {approvals.length} approval requests on this page
                </p>

                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={page === 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 disabled:opacity-40">Previous</button>
                  <button type="button" disabled={!hasNextPage || loading} onClick={() => setPage((value) => value + 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 disabled:opacity-40">Next</button>
                  <button type="button" onClick={fetchApprovals} disabled={loading} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Refreshing..." : "Refresh Requests"}</button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* CREATE APPROVAL MODAL */}

      {showCreateModal && (
        <CreateApprovalModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

     

      

      {/* APPROVAL ACTION MODAL */}

      {showActionModal && selectedApproval && (
        <ApprovalActionModal
          approval={selectedApproval}
          actionType={actionType}
          onClose={() => {
            console.log("Closing approval modal");

            setShowActionModal(false);
            setSelectedApproval(null);
            setActionType("");
          }}
          onSuccess={async () => {
            setShowActionModal(false);
            setSelectedApproval(null);
            setActionType("");
            await fetchApprovals();
          }}
        />
      )}


      {/* APPROVAL HISTORY MODAL */}

      {showHistoryModal && selectedApproval && (
        <ApprovalHistoryModal
          approval={selectedApproval}
          onClose={closeHistoryModal}
        />
      )}
    </div>
  );
}

// ---------------- SUMMARY CARD COMPONENT ----------------

function SummaryCard({ title, value, description, color }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-5 text-white shadow-lg`}
    >
      <p className="text-sm font-medium text-white/80">
        {title}
      </p>

      <h2 className="mt-3 text-3xl font-bold">
        {value}
      </h2>

      <p className="mt-2 text-xs text-white/80">
        {description}
      </p>
    </div>
  );
}

export default Approvals;

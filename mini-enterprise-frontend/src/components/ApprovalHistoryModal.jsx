import { useEffect, useState } from "react";
import { getApprovalHistory } from "../services/approvalService";

function ApprovalHistoryModal({ approval, closeModal }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getApprovalHistory(approval.id);
      setHistory(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load approval history.");
    } finally {
      setLoading(false);
    }
  };

  const getActionUI = (action) => {
    switch (action) {
      case "submitted":
        return {
          icon: "📤",
          color: "bg-blue-100 text-blue-700 border-blue-200",
          title: "Request Submitted",
        };

      case "manager_approved":
        return {
          icon: "🟢",
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
          title: "Manager Approved",
        };

      case "admin_approved":
        return {
          icon: "✅",
          color: "bg-green-100 text-green-700 border-green-200",
          title: "Admin Approved",
        };

      case "manager_rejected":
        return {
          icon: "🔴",
          color: "bg-red-100 text-red-700 border-red-200",
          title: "Manager Rejected",
        };

      case "admin_rejected":
        return {
          icon: "❌",
          color: "bg-red-100 text-red-700 border-red-200",
          title: "Admin Rejected",
        };

      case "manager_hold":
        return {
          icon: "⏸️",
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          title: "Manager Put On Hold",
        };

      case "admin_hold":
        return {
          icon: "⏳",
          color: "bg-orange-100 text-orange-700 border-orange-200",
          title: "Admin Put On Hold",
        };

      default:
        return {
          icon: "📌",
          color: "bg-slate-100 text-slate-700 border-slate-200",
          title: action,
        };
    }
  };

  const getUserRole = (action) => {
    if (action.includes("manager")) return "Manager";
    if (action.includes("admin")) return "Admin";
    if (action === "submitted") return "Employee";
    return "User";
  };

  const getUserName = (item) => {
    if (item.action_by_name) return item.action_by_name;
    return getUserRole(item.action);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        <div className="border-b border-slate-200 bg-gradient-to-r from-blue-700 to-slate-900 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold">
                Approval Activity Timeline
              </h2>

              <p className="mt-2 text-blue-100">
                Complete workflow history of this approval request.
              </p>
            </div>

            <button
              onClick={closeModal}
              className="text-3xl text-white hover:text-red-300"
            >
              ×
            </button>
          </div>

          <div className="mt-5 rounded-2xl bg-white/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-blue-100">
              Approval Request
            </p>

            <h3 className="mt-2 text-2xl font-bold">{approval.title}</h3>

            <p className="mt-2 text-sm text-blue-100">
              {approval.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase">
                Status : {approval.status}
              </span>

              <span className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase">
                Level : {approval.current_level}
              </span>

              <span className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase">
                Approval #{approval.id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">

          {loading ? (
            <div className="py-20 text-center text-slate-500">
              Loading approval timeline...
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              No activity found for this approval.
            </div>
          ) : (
            <div className="relative ml-5 border-l-2 border-blue-200">

              {history.map((item, index) => {
                const ui = getActionUI(item.action);

                return (
                  <div key={item.id} className="relative mb-10 ml-8">

                    <div className="absolute -left-[52px] flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-white text-xl shadow-lg">
                      {ui.icon}
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">

                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                            {getUserName(item).charAt(0)}
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {getUserName(item)}
                            </h3>

                            <p className="text-sm text-slate-500">
                              {getUserRole(item.action)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right text-sm text-slate-500">
                          <p>
                            {new Date(item.created_at).toLocaleDateString(
                              "en-GB"
                            )}
                          </p>

                          <p>
                            {new Date(item.created_at).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
                        <span
                          className={`rounded-full border px-4 py-2 text-xs font-bold uppercase ${ui.color}`}
                        >
                          {ui.title}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Step {index + 1}
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                        <p className="mb-2 text-sm font-semibold text-slate-600">
                          Comment
                        </p>

                        <p className="leading-7 text-slate-700">
                          {item.comment || "No comment was added for this action."}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                        <span>Approval ID #{approval.id}</span>

                        <span>Workflow Activity</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-8 py-5">
          <button
            onClick={closeModal}
            className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApprovalHistoryModal;
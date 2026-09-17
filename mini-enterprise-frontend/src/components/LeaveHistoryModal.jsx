import { useEffect, useState } from "react";
import { getLeaveHistory } from "../services/leaveService";

function LeaveHistoryModal({ leave, closeModal }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getLeaveHistory(leave.id);
      setHistory(data);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      alert("Failed to load leave history.");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "submitted":
        return "bg-blue-100 text-blue-700 border-blue-300";

      case "manager_approved":
      case "admin_approved":
        return "bg-green-100 text-green-700 border-green-300";

      case "manager_rejected":
      case "admin_rejected":
        return "bg-red-100 text-red-700 border-red-300";

      case "manager_hold":
      case "admin_hold":
        return "bg-purple-100 text-purple-700 border-purple-300";

      case "manager_resume":
      case "admin_resume":
        return "bg-indigo-100 text-indigo-700 border-indigo-300";

      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getEmoji = (action) => {
    switch (action) {
      case "submitted":
        return "📤";

      case "manager_approved":
      case "admin_approved":
        return "✅";

      case "manager_rejected":
      case "admin_rejected":
        return "❌";

      case "manager_hold":
      case "admin_hold":
        return "⏸️";

      case "manager_resume":
      case "admin_resume":
        return "▶️";

      default:
        return "📌";
    }
  };

  const getActionTitle = (action) => {
    switch (action) {
      case "submitted":
        return "Leave Request Submitted";

      case "manager_approved":
        return "Approved by Manager";

      case "admin_approved":
        return "Final Approved by Admin";

      case "manager_rejected":
        return "Rejected by Manager";

      case "admin_rejected":
        return "Rejected by Admin";

      case "manager_hold":
        return "Put On Hold by Manager";

      case "admin_hold":
        return "Put On Hold by Admin";

      case "manager_resume":
        return "Resumed by Manager";

      case "admin_resume":
        return "Resumed by Admin";

      default:
        return action.replace(/_/g, " ");
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "employee":
        return "bg-blue-100 text-blue-700";

      case "manager":
        return "bg-purple-100 text-purple-700";

      case "admin":
        return "bg-green-100 text-green-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}

        <div className="border-b border-slate-200 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Leave History Timeline
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {leave.leave_type}
              </p>
            </div>

            <button
              onClick={closeModal}
              className="text-2xl text-slate-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Employee</p>
              <h4 className="mt-1 font-semibold text-slate-800">
                {leave.employee_name || "Employee"}
              </h4>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Duration</p>
              <h4 className="mt-1 font-semibold text-slate-800">
                {leave.days} Day{leave.days > 1 ? "s" : ""}
              </h4>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Current Status</p>
              <span
                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${getActionColor(
                  leave.status
                )}`}
              >
                {leave.status}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Leave Type</p>
              <h4 className="mt-1 font-semibold text-slate-800">
                {leave.leave_type}
              </h4>
            </div>

          </div>
        </div>

             

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">

              <svg
                className="h-10 w-10 animate-spin text-blue-700"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-20"
                />

                <path
                  fill="currentColor"
                  d="M12 2a10 10 0 015 1.3V6a7 7 0 00-5-2V2z"
                />
              </svg>

              <p className="mt-4 text-sm text-slate-500">
                Loading leave timeline...
              </p>

            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">

              <div className="rounded-full bg-slate-100 p-5 text-4xl">
                📋
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-700">
                No Leave History Available
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Timeline will appear after manager or admin performs an action.
              </p>

            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 pl-8">

              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="relative mb-10 last:mb-0"
                >
                  

                  <div
                    className={`absolute -left-[43px] flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-lg shadow ${getActionColor(
                      item.action
                    )}`}
                  >
                    {getEmoji(item.action)}
                  </div>

                
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">

                    

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      <div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${getActionColor(
                            item.action
                          )}`}
                        >
                          {getActionTitle(item.action)}
                        </span>

                        <h3 className="mt-3 text-lg font-bold text-slate-900">
                          {item.action_by_name || "Unknown User"}
                        </h3>

                        <span
                          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${getRoleBadge(
                            item.action_by_role
                          )}`}
                        >
                          {item.action_by_role || "USER"}
                        </span>
                      </div>

                      {/* Date & Time */}

                      <div className="text-right text-sm text-slate-500">

                        <p>
                          {new Date(item.created_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>

                        <p className="mt-1">
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

                    

                    <div className="mt-5 rounded-xl bg-white p-4">

                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Comment
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.comment || "No comment provided."}
                      </p>

                    </div>

                    

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">

                      <span>Step {index + 1}</span>

                      <span>Leave ID #{leave.id}</span>

                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

       

        <div className="border-t border-slate-200 bg-slate-50 px-8 py-5">
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

export default LeaveHistoryModal;
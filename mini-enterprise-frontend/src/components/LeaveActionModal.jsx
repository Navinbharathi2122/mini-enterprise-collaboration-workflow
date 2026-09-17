import { useState } from "react";
import { takeLeaveAction } from "../services/leaveService";

function LeaveActionModal({
  leave,
  actionType,
  closeModal,
  refreshLeaveRequests,
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const titles = {
    approve: "Approve Leave",
    reject: "Reject Leave",
    hold: "Put Leave On Hold",
    resume: "Resume Leave Request",
  };

  const colors = {
    approve: "bg-green-600 hover:bg-green-700",
    reject: "bg-red-600 hover:bg-red-700",
    hold: "bg-purple-600 hover:bg-purple-700",
    resume: "bg-blue-600 hover:bg-blue-700",
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await takeLeaveAction(leave.id, {
        action: actionType,
        comment,
      });

      await refreshLeaveRequests();
      closeModal();
    } catch (error) {
      console.error("Leave action failed:", error);
      alert("Failed to update leave request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-800">
          {titles[actionType]}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Employee: <span className="font-semibold">{leave.requested_by_name}</span>
        </p>

        <p className="text-sm text-slate-500">
          Leave Type: <span className="font-semibold">{leave.leave_type}</span>
        </p>

        <p className="text-sm text-slate-500">
          Duration: {leave.start_date} → {leave.end_date}
        </p>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Comment
          </label>

          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your comment..."
            className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="rounded-xl border border-slate-300 px-5 py-2 font-medium text-slate-700"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`rounded-xl px-5 py-2 font-semibold text-white ${colors[actionType]}`}
          >
            {loading ? "Processing..." : titles[actionType]}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaveActionModal;
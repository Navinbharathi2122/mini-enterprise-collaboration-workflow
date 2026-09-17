import { useState } from "react";
import { takeApprovalAction } from "../services/approvalService";

function ApprovalActionModal({
  approval,
  actionType,
  closeModal,
  refreshApprovals,
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitAction = async () => {
    if (actionType === "rejected" && comment.trim() === "") {
      alert("Rejection comment is mandatory.");
      return;
    }

    try {
      setLoading(true);

      await takeApprovalAction(approval.id, {
        action: actionType,
        comment,
      });

      const message =
        actionType === "approved"
          ? "Approval approved successfully."
          : actionType === "rejected"
          ? "Approval rejected successfully."
          : "Approval moved to Hold successfully.";

      alert(message);

      refreshApprovals();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.detail || "Failed to update approval.");
    } finally {
      setLoading(false);
    }
  };

  const titleColor =
    actionType === "approved"
      ? "text-green-700"
      : actionType === "rejected"
      ? "text-red-700"
      : "text-amber-700";

  const buttonColor =
    actionType === "approved"
      ? "bg-green-600 hover:bg-green-700"
      : actionType === "rejected"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-amber-500 hover:bg-amber-600";

  const icon =
    actionType === "approved"
      ? "✅"
      : actionType === "rejected"
      ? "❌"
      : "⏸️";

  const placeholder =
    actionType === "approved"
      ? "Add approval note (optional)..."
      : actionType === "rejected"
      ? "Enter rejection reason..."
      : "Reason for keeping this approval on hold...";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-8 py-6">
          <div>
            <h2 className={`text-2xl font-bold capitalize ${titleColor}`}>
              {icon} {actionType} Approval
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review this approval request before taking action.
            </p>
          </div>

          <button
            onClick={closeModal}
            className="text-2xl text-slate-400 transition hover:text-red-500"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-8">
          <div className="rounded-2xl border bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Approval Request
            </p>

            <h3 className="mt-2 text-lg font-bold text-slate-800">
              {approval.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {approval.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500">Current Status</p>

              <p className="mt-1 font-semibold capitalize text-slate-800">
                {approval.status}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500">Approval Level</p>

              <p className="mt-1 font-semibold capitalize text-slate-800">
                {approval.current_level}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Comment
              {actionType === "rejected" && (
                <span className="text-red-600"> *</span>
              )}
            </label>

            <textarea
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {actionType === "hold" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                ⏸️ Hold means this approval stays pending.
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Manager or Admin can approve or reject it later.
              </p>
            </div>
          )}

          {actionType === "approved" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">
                This request will move to the next approval stage or become fully
                approved.
              </p>
            </div>
          )}

          {actionType === "rejected" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Employee will be able to see the rejection reason.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t px-8 py-6">
          <button
            onClick={closeModal}
            className="rounded-xl border border-slate-300 px-5 py-3 font-medium transition hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={submitAction}
            className={`rounded-xl px-6 py-3 font-semibold text-white transition disabled:bg-slate-400 ${buttonColor}`}
          >
            {loading
              ? "Processing..."
              : actionType === "approved"
              ? "Approve Request"
              : actionType === "rejected"
              ? "Reject Request"
              : "Move to Hold"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApprovalActionModal;
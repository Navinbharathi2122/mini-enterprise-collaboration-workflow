
import { useState } from "react";
import { takeApprovalAction } from "../services/approvalService";

function ApprovalActionModal(props) {
  const { approval, actionType, onSuccess } = props;

  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const actionLabels = {
    approve: "Approve Request",
    reject: "Reject Request",
    hold: "Put Request On Hold",
    resume: "Resume Request",
  };

  const actionStyles = {
    approve: "bg-green-600 hover:bg-green-700",
    reject: "bg-red-600 hover:bg-red-700",
    hold: "bg-purple-600 hover:bg-purple-700",
    resume: "bg-blue-600 hover:bg-blue-700",
  };

  const isReject = actionType === "reject";

  // Close modal using the parent callback.
  const handleClose = () => {
    console.log("Close button clicked");
    console.log("onClose prop:", props.onClose);

    if (typeof props.onClose === "function") {
      props.onClose();
    } else {
      console.error(
        "onClose prop is missing. Check the parent Approvals.jsx."
      );
      setError(
        "Modal close handler is missing. Please check Approvals.jsx."
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!approval?.id) {
      setError("Approval request ID is missing.");
      return;
    }

    if (isReject && !comment.trim()) {
      setError("Please enter a comment before rejecting the request.");
      return;
    }

    try {
      setLoading(true);

      await takeApprovalAction(approval.id, {
        action: actionType,
        comment: comment.trim() || null,
      });

      if (typeof onSuccess === "function") {
        await onSuccess();
      } else {
        handleClose();
      }
    } catch (err) {
      console.error("Approval action error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to process this request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const title = actionLabels[actionType] || "Review Request";

  const buttonStyle =
    actionStyles[actionType] || "bg-blue-600 hover:bg-blue-700";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="approval-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
      >
        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="approval-modal-title"
              className={`text-2xl font-bold ${
                isReject ? "text-red-600" : "text-green-700"
              }`}
            >
              {isReject
                ? "❌ Reject Request"
                : actionType === "hold"
                ? "⏸️ Hold Request"
                : actionType === "resume"
                ? "▶️ Resume Request"
                : "✅ Approve Request"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the request before taking action.
            </p>
          </div>

          {/* X BUTTON */}

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close approval modal"
            className="ml-4 rounded-lg p-2 text-3xl leading-none text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            ×
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Approval Request
              </p>

              <h3 className="mt-2 break-words text-xl font-bold text-slate-800">
                {approval?.title || "Untitled Request"}
              </h3>

              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">
                {approval?.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Current Status
                </p>

                <p className="mt-1 break-words font-semibold capitalize text-slate-800">
                  {(approval?.status || "unknown").replace(/_/g, " ")}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Approval Level
                </p>

                <p className="mt-1 font-semibold capitalize text-slate-800">
                  {approval?.current_level || "Unknown"}
                </p>
              </div>
            </div>

            {/* COMMENT */}

            <div>
              <label
                htmlFor="approval-comment"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Comment {isReject ? "(Required)" : "(Optional)"}
              </label>

              <textarea
                id="approval-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={
                  isReject
                    ? "Enter the reason for rejection..."
                    : "Add approval note (optional)..."
                }
                rows={4}
                disabled={loading}
                required={isReject}
                className="w-full rounded-2xl border border-slate-300 p-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            {/* ACTION MESSAGE */}

            <div
              className={`rounded-xl border p-4 text-sm ${
                isReject
                  ? "border-red-200 bg-red-50 text-red-700"
                  : actionType === "hold"
                  ? "border-purple-200 bg-purple-50 text-purple-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {isReject
                ? "The request will be rejected."
                : actionType === "hold"
                ? "The request will be placed on hold."
                : actionType === "resume"
                ? "The request will resume its approval workflow."
                : "The request will move to the next stage or become fully approved, depending on your role."}
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !["approve", "reject", "hold", "resume"].includes(
                  actionType
                )
              }
              className={`rounded-xl px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${buttonStyle}`}
            >
              {loading ? "Processing..." : title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApprovalActionModal;

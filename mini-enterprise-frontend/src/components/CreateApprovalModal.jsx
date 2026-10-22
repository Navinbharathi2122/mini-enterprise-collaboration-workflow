
import { useState } from "react";
import { createApproval } from "../services/approvalService";

function CreateApprovalModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleClose = () => {
    if (loading) return;

    if (typeof onClose === "function") {
      onClose();
    }
  };

  const submitApproval = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      await createApproval(formData);

      alert("Approval request submitted successfully.");

      if (typeof onSuccess === "function") {
        await onSuccess();
      } else if (typeof onClose === "function") {
        onClose();
      }
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Failed to submit approval."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-approval-title"
        className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="create-approval-title"
            className="text-2xl font-bold text-slate-900"
          >
            Create Approval Request
          </h2>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close create approval modal"
            className="rounded-lg p-2 text-2xl text-slate-500 hover:bg-slate-100 hover:text-red-500 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitApproval} className="space-y-5">
          <div>
            <label
              htmlFor="approval-title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Approval Title
            </label>

            <input
              id="approval-title"
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter approval title"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="approval-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="approval-description"
              name="description"
              rows={5}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter approval description"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loading ? "Submitting..." : "Submit Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateApprovalModal;

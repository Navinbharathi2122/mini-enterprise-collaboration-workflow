import { useState } from "react";
import { createApproval } from "../services/approvalService";

function CreateApprovalModal({ closeModal, refreshApprovals }) {
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

  const submitApproval = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createApproval(formData);

      alert("Approval request submitted successfully.");

      refreshApprovals();
      closeModal();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Create Approval Request
          </h2>

          <button
            onClick={closeModal}
            className="text-2xl text-slate-500 hover:text-red-500"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submitApproval} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Approval Title
            </label>

            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder=" "
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              rows="5"
              required
              value={formData.description}
              onChange={handleChange}
              placeholder=""
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:bg-blue-400"
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
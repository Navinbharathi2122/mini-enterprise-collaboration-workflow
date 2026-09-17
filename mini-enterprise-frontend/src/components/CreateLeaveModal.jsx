import { useMemo, useState } from "react";
import { createLeaveRequest } from "../services/leaveService";

function CreateLeaveModal({ closeModal, refreshLeaveRequests }) {
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const diff =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    return diff >= 0 ? diff + 1 : 0;
  }, [startDate, endDate]);

  const leaveTypes = [
    "Casual Leave",
    "Sick Leave",
    "Earned Leave",
    "Vacation Leave",
    "Medical Leave",
    "Work From Home",
    "Maternity Leave",
    "Paternity Leave",
  ];

  const handleSubmit = async () => {
    setError("");

    if (!startDate || !endDate || !reason.trim()) {
      setError("Please fill all required fields.");
      return;
    }

    if (totalDays <= 0) {
      setError("End date must be after start date.");
      return;
    }

    try {
      setLoading(true);

      await createLeaveRequest({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });

      alert("Leave request submitted successfully.");

      refreshLeaveRequests();
      closeModal();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to submit leave request."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Apply Leave Request
            </h2>

            <p className="text-sm text-slate-500">
              Submit your leave request for manager approval.
            </p>
          </div>

          <button
            onClick={closeModal}
            className="text-2xl text-slate-500 hover:text-red-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Leave Type
            </label>

            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            >
              {leaveTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                End Date
              </label>

              <input
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 p-5">
            <p className="text-sm text-blue-700">Total Leave Days</p>

            <h2 className="text-3xl font-bold text-blue-800">
              {totalDays}
            </h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Reason
            </label>

            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter leave reason..."
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t pt-6">
            <button
              onClick={closeModal}
              className="rounded-xl border px-5 py-3 font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400"
            >
              {loading ? "Submitting..." : "Apply Leave"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateLeaveModal;
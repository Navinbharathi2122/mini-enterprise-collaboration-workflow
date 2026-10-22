import { useMemo, useState } from "react";
import { createLeaveRequest } from "../services/leaveService";

function CreateLeaveModal({ closeModal, refreshLeaveRequests, userRole = "employee" }) {
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedRole = String(userRole).toLowerCase().trim().replace(/[_-]+/g, " ");
  const isManager = ["manager", "team leader", "teamlead", "team lead"].includes(normalizedRole);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 ? diff + 1 : 0;
  }, [startDate, endDate]);

  const leaveTypes = [
    "Casual Leave", "Sick Leave", "Earned Leave", "Vacation Leave",
    "Medical Leave", "Work From Home", "Maternity Leave", "Paternity Leave",
  ];

  const handleSubmit = async () => {
    setError("");
    if (!startDate || !endDate || !reason.trim()) {
      setError("Please fill all required fields.");
      return;
    }
    if (totalDays <= 0) {
      setError("End date must be on or after the start date.");
      return;
    }

    try {
      setLoading(true);
      await createLeaveRequest({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });
      alert(isManager
        ? "Leave request created successfully. It has been sent to Admin for approval."
        : "Leave request submitted successfully. It has been sent to Manager for approval.");
      await refreshLeaveRequests();
      closeModal();
    } catch (err) {
      console.error("Create leave request failed:", err);
      setError(err.response?.data?.detail || "Failed to submit leave request.");
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
              {isManager ? "Create Leave Request" : "Apply Leave Request"}
            </h2>
            <p className="text-sm text-slate-500">
              {isManager
                ? "Submit your leave request directly to Admin for approval."
                : "Submit your leave request for manager approval."}
            </p>
          </div>
          <button onClick={closeModal} aria-label="Close modal" className="text-2xl text-slate-500 hover:text-red-600">✕</button>
        </div>

        <div className="space-y-6 p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold">Leave Type</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full rounded-xl border px-4 py-3">
              {leaveTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate && endDate < e.target.value) setEndDate("");
              }} className="w-full rounded-xl border px-4 py-3" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">End Date</label>
              <input type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border px-4 py-3" />
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 p-5">
            <p className="text-sm text-blue-700">Total Leave Days</p>
            <h2 className="text-3xl font-bold text-blue-800">{totalDays}</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Reason</label>
            <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter leave reason..." className="w-full rounded-xl border px-4 py-3" />
          </div>

          {error && <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-3 border-t pt-6">
            <button onClick={closeModal} disabled={loading} className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400">
              {loading ? "Submitting..." : isManager ? "Send to Admin" : "Apply Leave"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateLeaveModal;

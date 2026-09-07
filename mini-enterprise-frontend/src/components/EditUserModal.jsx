import { useState } from "react";
import { updateUser } from "../services/usersService";

function EditUserModal({ user, closeModal, refreshUsers }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    role: user.role || "employee",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await updateUser(user.id, formData);

      alert("User updated successfully.");

      refreshUsers();
      closeModal();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Unable to update user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Edit User
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update enterprise user details and role.
            </p>
          </div>

          <button
            onClick={closeModal}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5 p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter company email"
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              User Role
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              User Summary
            </p>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>User ID</span>

                <span className="font-semibold text-slate-900">
                  #{user.id}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Current Name</span>

                <span className="font-semibold text-slate-900">
                  {user.name}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Current Email</span>

                <span className="font-semibold text-slate-900">
                  {user.email}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Selected Role</span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    formData.role === "admin"
                      ? "bg-blue-100 text-blue-700"
                      : formData.role === "manager"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {formData.role}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">
              Updating a user's role will immediately change their access
              permissions in the STACKLY workflow system.
            </p>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating User..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
import { useEffect, useState } from "react";
import { updateTask } from "../services/taskService";
import { getAllUsers } from "../services/usersService";
import { getUserFromToken } from "../utils/jwt";

function EditTaskModal({ task, closeModal, refreshTasks }) {
  const currentUser = getUserFromToken();

  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";
  const isEmployee = currentUser?.role === "employee";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [taskData, setTaskData] = useState({
    title: task.title || "",
    description: task.description || "",
    status: task.status || "pending",
    priority: task.priority || "medium",
    due_date: task.due_date
      ? new Date(task.due_date).toISOString().slice(0, 16)
      : "",
    assigned_to_id: task.assigned_to_id || "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();

      if (isManager) {
        setUsers(data.filter((user) => user.role === "employee"));
      } else {
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleChange = (e) => {
    setTaskData({
      ...taskData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await updateTask(task.id, {
        ...taskData,
        assigned_to_id: taskData.assigned_to_id
          ? Number(taskData.assigned_to_id)
          : null,
      });

      alert("Task updated successfully.");

      refreshTasks();
      closeModal();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Unable to update task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Edit Task</h2>
            <p className="mt-1 text-sm text-slate-500">
              Update task details and assignment.
            </p>
          </div>

          <button
            onClick={closeModal}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpdate} className="flex h-[calc(90vh-88px)] flex-col">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Task Title
              </label>
              <input
                type="text"
                name="title"
                value={taskData.title}
                onChange={handleChange}
                disabled={isEmployee}
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>
              <textarea
                name="description"
                rows="4"
                value={taskData.description}
                onChange={handleChange}
                disabled={isEmployee}
                className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>
                <select
                  name="status"
                  value={taskData.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Priority
                </label>
                <select
                  name="priority"
                  value={taskData.priority}
                  onChange={handleChange}
                  disabled={isEmployee}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Due Date
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={taskData.due_date}
                onChange={handleChange}
                disabled={isEmployee}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
              />
            </div>

            {!isEmployee && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Assign To
                </label>
                <select
                  name="assigned_to_id"
                  value={taskData.assigned_to_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">
                Task Summary
              </h3>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Task ID</span>
                  <span className="font-semibold text-slate-900">#{task.id}</span>
                </div>

                <div className="flex justify-between">
                  <span>Assigned To</span>
                  <span className="font-semibold text-slate-900">
                    {users.find((u) => u.id === Number(taskData.assigned_to_id))
                      ?.name || task.assigned_to_name || "Not Assigned"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 capitalize">
                    {taskData.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Priority</span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 capitalize">
                    {taskData.priority}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Updated By</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {currentUser?.role}
                  </span>
                </div>
              </div>
            </div>

            {isEmployee && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                Employees can only update the status of tasks assigned to them.
              </div>
            )}

            {isManager && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Managers can update tasks and assign them only to Employees.
              </div>
            )}

            {isAdmin && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                Admin has full permission to update task details and assignments.
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-8 py-5 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 transition disabled:opacity-60"
            >
              {loading ? "Updating Task..." : "Update Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTaskModal;
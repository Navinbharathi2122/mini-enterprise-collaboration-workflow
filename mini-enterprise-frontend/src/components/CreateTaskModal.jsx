import { useEffect, useState } from "react";
import { createTask } from "../services/taskService";
import { getAllUsers } from "../services/usersService";
import { getUserFromToken } from "../utils/jwt";

function CreateTaskModal({ closeModal, refreshTasks }) {
  const currentUser = getUserFromToken();

  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
    assigned_to_id: "",
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

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createTask({
        ...taskData,
        assigned_to_id: taskData.assigned_to_id
          ? Number(taskData.assigned_to_id)
          : null,
      });

      alert("Task created successfully.");

      refreshTasks();
      closeModal();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Unable to create task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Create New Task
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assign workflow tasks to employees.
            </p>
          </div>

          <button
            onClick={closeModal}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-6 p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Task Title
            </label>

            <input
              type="text"
              name="title"
              value={taskData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              value={taskData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Enter task description"
              className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
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
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
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
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Assign To
            </label>

            <select
              name="assigned_to_id"
              value={taskData.assigned_to_id}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select Employee</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>

            {isManager && (
              <p className="mt-2 text-xs text-emerald-600">
                Manager can assign tasks only to Employees.
              </p>
            )}

            {isAdmin && (
              <p className="mt-2 text-xs text-blue-600">
                Admin can assign tasks to Admin, Manager, or Employee.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Task Assignment Summary
            </p>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Created By</span>

                <span className="font-semibold text-slate-800">
                  {currentUser?.name || currentUser?.email}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Role</span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    isAdmin
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {currentUser?.role}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Priority</span>

                <span className="font-semibold capitalize text-slate-800">
                  {taskData.priority}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Status</span>

                <span className="font-semibold capitalize text-slate-800">
                  {taskData.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Assigned User</span>

                <span className="font-semibold text-slate-800">
                  {users.find(
                    (u) => u.id === Number(taskData.assigned_to_id)
                  )?.name || "Not Selected"}
                </span>
              </div>
            </div>
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
              {loading ? "Creating Task..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTaskModal;
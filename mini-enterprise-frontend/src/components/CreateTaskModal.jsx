
import { useEffect, useState } from "react";
import { createTask } from "../services/taskService";
import { getAllUsers } from "../services/usersService";
import { getUserFromToken } from "../utils/jwt";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

function CreateTaskModal({ closeModal, refreshTasks }) {
  const currentUser = getUserFromToken();

  const role = String(currentUser?.role || "").trim().toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
    assigned_to_id: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);

      const response = await getAllUsers();
      const userList = Array.isArray(response)
        ? response
        : Array.isArray(response?.users)
          ? response.users
          : [];

      if (isManager) {
        setUsers(
          userList.filter(
            (user) =>
              String(user.role || "").trim().toLowerCase() === "employee"
          )
        );
      } else {
        setUsers(userList);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setTaskData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!taskData.title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    if (!STATUS_OPTIONS.some((item) => item.value === taskData.status)) {
      alert("Please select a valid task status.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: taskData.title.trim(),
        description: taskData.description.trim(),
        status: taskData.status,
        priority: taskData.priority,
        due_date: taskData.due_date
          ? new Date(taskData.due_date).toISOString()
          : null,
        assigned_to_id: taskData.assigned_to_id
          ? Number(taskData.assigned_to_id)
          : null,
      };

      await createTask(payload);

      await refreshTasks();

      alert("Task created successfully.");
      closeModal();
    } catch (error) {
      console.error("Error creating task:", error);

      const detail = error.response?.data?.detail;

      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg || JSON.stringify(item)).join("\n")
        : typeof detail === "string"
          ? detail
          : error.message || "Unable to create task. Please try again.";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          closeModal();
        }
      }}
    >
      <div className="my-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-8 sm:py-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Create New Task
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assign workflow tasks to employees.
            </p>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            aria-label="Close modal"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleCreate}
          className="min-h-0 space-y-5 overflow-y-auto overscroll-contain p-5 sm:space-y-6 sm:p-8"
        >
          {/* Task Title */}
          <div>
            <label
              htmlFor="task-title"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Task Title
            </label>

            <input
              id="task-title"
              type="text"
              name="title"
              value={taskData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              maxLength={255}
              required
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="task-description"
              name="description"
              value={taskData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Enter task description"
              className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="task-status"
                name="status"
                value={taskData.status}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                New tasks normally start at To Do.
              </p>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Priority
              </label>

              <select
                id="task-priority"
                name="priority"
                value={taskData.priority}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="task-due-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Due Date
            </label>

            <input
              id="task-due-date"
              type="datetime-local"
              name="due_date"
              value={taskData.due_date}
              onChange={handleChange}
              className="w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Assign To */}
          <div>
            <label
              htmlFor="task-assignee"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Assign To
            </label>

            <select
              id="task-assignee"
              name="assigned_to_id"
              value={taskData.assigned_to_id}
              onChange={handleChange}
              disabled={usersLoading}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-60"
            >
              <option value="">
                {usersLoading ? "Loading users..." : "Select User"}
              </option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email || `User ${user.id}`} (
                  {user.role})
                </option>
              ))}
            </select>

            {!usersLoading && users.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                No users found. Check the users API and your permissions.
              </p>
            )}

            {isManager && (
              <p className="mt-2 text-xs text-emerald-600">
                Manager can assign tasks only to Employees.
              </p>
            )}

            {isAdmin && (
              <p className="mt-2 text-xs text-blue-600">
                Admin can assign tasks to available users.
              </p>
            )}
          </div>

          {/* Assignment Summary */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Task Assignment Summary
            </p>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start justify-between gap-4">
                <span>Created By</span>

                <span className="break-all text-right font-semibold text-slate-800">
                  {currentUser?.name ||
                    currentUser?.email ||
                    "Current User"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>Role</span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    isAdmin
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {currentUser?.role || "Unknown"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>Priority</span>

                <span className="font-semibold capitalize text-slate-800">
                  {taskData.priority}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span>Status</span>

                <span className="font-semibold text-slate-800">
                  {STATUS_OPTIONS.find(
                    (status) => status.value === taskData.status
                  )?.label || "To Do"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span>Assigned User</span>

                <span className="text-right font-semibold text-slate-800">
                  {users.find(
                    (user) =>
                      String(user.id) === String(taskData.assigned_to_id)
                  )?.name ||
                    users.find(
                      (user) =>
                        String(user.id) === String(taskData.assigned_to_id)
                    )?.email ||
                    "Not Selected"}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end sm:pt-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
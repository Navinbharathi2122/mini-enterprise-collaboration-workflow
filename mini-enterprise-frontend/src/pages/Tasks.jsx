
import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import CreateTaskModal from "../components/CreateTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import DeleteTaskModal from "../components/DeleteTaskModal";
import TaskCommentsModal from "../components/TaskCommentsModal";

import { getAllTasks } from "../services/taskService";
import api from "../services/axios";

function Tasks() {
  const [currentUser, setCurrentUser] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [taskError, setTaskError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  // Get role from backend, not from the old local JWT
  const role = String(currentUser?.role || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  const isAdmin = ["admin", "administrator", "super_admin"].includes(role);
  const isManager = ["manager", "team_leader", "teamleader"].includes(role);

  useEffect(() => {
    let cancelled = false;

    async function fetchCurrentUser() {
      try {
        setRoleLoading(true);
        setRoleError("");

        const response = await api.get("/users/me");

        if (!cancelled) {
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.error("Unable to fetch current user:", error);

        if (!cancelled) {
          setRoleError(
            error.response?.data?.detail ||
              "Unable to verify your role. Please refresh the page."
          );
        }
      } finally {
        if (!cancelled) {
          setRoleLoading(false);
        }
      }
    }

    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch tasks after the role is verified
  useEffect(() => {
    if (roleLoading || roleError || !currentUser) {
      return;
    }

    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoading, roleError, currentUser, page, statusFilter, priorityFilter]);

  async function fetchTasks() {
    try {
      setLoading(true);
      setTaskError("");

      const data = await getAllTasks(page, 20, statusFilter, priorityFilter);
      const rows = Array.isArray(data) ? data : [];
      setTasks(rows);
      setHasNextPage(rows.length === 20);
    } catch (error) {
      console.error("Unable to fetch tasks:", error);

      setTasks([]);
      setTaskError(
        error.response?.data?.detail || "Unable to load tasks."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredTasks = tasks.filter((task) =>
    String(task.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const todoTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "todo"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "in_progress"
  ).length;

  const reviewTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "review"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status?.toLowerCase() === "done"
  ).length;

  const pendingTasks = todoTasks + inProgressTasks + reviewTasks;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Task Management
              </h1>

              <p className="mt-2 text-slate-500">
                Create, assign, update and monitor workflow tasks across your
                team.
              </p>
            </div>

            {/* Admin and Manager can create tasks */}
            {!roleLoading &&
              !roleError &&
              (isAdmin || isManager) && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  + Create Task
                </button>
              )}
          </div>

          {/* Role verification */}
          {roleLoading && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
              Verifying your permissions...
            </div>
          )}

          {roleError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {roleError}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="ml-3 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Summary cards */}
          <div className="mb-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Tasks</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {tasks.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Completed</p>
              <h2 className="mt-2 text-3xl font-bold text-emerald-600">
                {completedTasks}
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Pending</p>
              <h2 className="mt-2 text-3xl font-bold text-amber-600">
                {pendingTasks}
              </h2>
            </div>
          </div>

          {/* Workflow summary */}
          <div className="mb-8 grid gap-5 md:grid-cols-4">
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
              <p className="text-sm font-medium text-yellow-700">TODO</p>
              <h3 className="mt-2 text-3xl font-bold text-yellow-700">
                {todoTasks}
              </h3>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">IN PROGRESS</p>
              <h3 className="mt-2 text-3xl font-bold text-blue-700">
                {inProgressTasks}
              </h3>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
              <p className="text-sm font-medium text-purple-700">REVIEW</p>
              <h3 className="mt-2 text-3xl font-bold text-purple-700">
                {reviewTasks}
              </h3>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-medium text-green-700">DONE</p>
              <h3 className="mt-2 text-3xl font-bold text-green-700">
                {completedTasks}
              </h3>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              placeholder="Search task by title..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {taskError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {taskError}
              <button
                type="button"
                onClick={fetchTasks}
                className="ml-3 font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-600">Status
              <select className="ml-2 rounded-lg border border-slate-300 bg-white p-2" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
                <option value="">All statuses</option><option value="todo">To do</option><option value="in_progress">In progress</option><option value="review">Review</option><option value="done">Done</option>
              </select>
            </label>
            <label className="text-sm text-slate-600">Priority
              <select className="ml-2 rounded-lg border border-slate-300 bg-white p-2" value={priorityFilter} onChange={(e) => { setPage(1); setPriorityFilter(e.target.value); }}>
                <option value="">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </label>
          </div>

          {/* Task table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-100">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Task</th>
                    <th className="px-6 py-4">Assigned To</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        Loading tasks...
                      </td>
                    </tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-slate-500"
                      >
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-700">
                          #{task.id}
                        </td>

                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">
                            {task.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {task.description || "No description available"}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-slate-700">
                          {task.assigned_to_name || "Not Assigned"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              task.status === "done"
                                ? "bg-green-100 text-green-700"
                                : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-700"
                                : task.status === "review"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {String(task.status || "todo").replace("_", " ")}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : task.priority === "medium"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {task.priority || "medium"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowCommentsModal(true);
                              }}
                              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                            >
                              💬 Comments
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowEditModal(true);
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            {(isAdmin || isManager) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowDeleteModal(true);
                                }}
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">Page {page} · {tasks.length} records on this page</span>
            <div className="flex gap-2">
              <button type="button" disabled={page === 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border px-4 py-2 disabled:opacity-40">Previous</button>
              <button type="button" disabled={!hasNextPage || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Next</button>
            </div>
          </div>

          {/* Create task modal */}
          {showCreateModal && (
            <CreateTaskModal
              closeModal={() => setShowCreateModal(false)}
              refreshTasks={fetchTasks}
            />
          )}

          {/* Edit task modal */}
          {showEditModal && selectedTask && (
            <EditTaskModal
              task={selectedTask}
              closeModal={() => {
                setShowEditModal(false);
                setSelectedTask(null);
              }}
              refreshTasks={fetchTasks}
            />
          )}

          {/* Delete task modal */}
          {showDeleteModal && selectedTask && (
            <DeleteTaskModal
              task={selectedTask}
              closeModal={() => {
                setShowDeleteModal(false);
                setSelectedTask(null);
              }}
              refreshTasks={fetchTasks}
            />
          )}

          {/* Comments modal */}
          {showCommentsModal && selectedTask && (
            <TaskCommentsModal
              task={selectedTask}
              closeModal={() => {
                setShowCommentsModal(false);
                setSelectedTask(null);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default Tasks;

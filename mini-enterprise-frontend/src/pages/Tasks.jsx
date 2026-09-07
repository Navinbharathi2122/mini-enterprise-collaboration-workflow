import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import CreateTaskModal from "../components/CreateTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import DeleteTaskModal from "../components/DeleteTaskModal";

import { getAllTasks } from "../services/taskService";
import { getUserFromToken } from "../utils/jwt";

function Tasks() {
  const currentUser = getUserFromToken();

  const isAdmin = currentUser?.role === "admin";
  const isManager = currentUser?.role === "manager";

  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "completed"
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Task Management
              </h1>

              <p className="mt-2 text-slate-500">
                Create, assign, update and monitor workflow tasks across your team.
              </p>
            </div>

            {(isAdmin || isManager) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + Create Task
              </button>
            )}
          </div>

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

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              placeholder="Search task by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </div>

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
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                        Loading tasks...
                      </td>
                    </tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
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
                              task.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {task.status.replace("_", " ")}
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
                            {task.priority}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedTask(task);
                                setShowEditModal(true);
                              }}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowDeleteModal(true);
                                }}
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
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

          {showCreateModal && (
            <CreateTaskModal
              closeModal={() => setShowCreateModal(false)}
              refreshTasks={fetchTasks}
            />
          )}

          {showEditModal && selectedTask && (
            <EditTaskModal
              task={selectedTask}
              closeModal={() => setShowEditModal(false)}
              refreshTasks={fetchTasks}
            />
          )}

          {showDeleteModal && selectedTask && (
            <DeleteTaskModal
              task={selectedTask}
              closeModal={() => setShowDeleteModal(false)}
              refreshTasks={fetchTasks}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default Tasks;
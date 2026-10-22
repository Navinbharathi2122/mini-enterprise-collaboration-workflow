import { deleteTask } from "../services/taskService";

function DeleteTaskModal({ task, closeModal, refreshTasks }) {
  const handleDelete = async () => {
    try {
      await deleteTask(task.id);

      alert("Task deleted successfully.");

      refreshTasks();
      closeModal();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Unable to delete task.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-8 py-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
            🗑️
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            Delete Task
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            This action cannot be undone.
          </p>
        </div>

        <div className="px-8 py-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Task Information
            </p>

            <h3 className="text-lg font-semibold text-slate-900">
              {task.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {task.description || "No description available."}
            </p>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Task ID</span>

                <span className="font-semibold text-slate-800">
                  #{task.id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Assigned To</span>

                <span className="font-semibold text-slate-800">
                  {task.assigned_to_name || "Not Assigned"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Priority</span>

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
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Status</span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "in_progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {task.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm leading-6 text-red-700">
              Deleting this task will permanently remove it from the enterprise
              workflow management system. This action cannot be reversed.
            </p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-red-700"
            >
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteTaskModal;
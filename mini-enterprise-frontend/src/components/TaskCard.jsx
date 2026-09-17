import { Draggable } from "@hello-pangea/dnd";

function TaskCard({ task, index }) {
  const priorityColor = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="cursor-grab rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-lg active:cursor-grabbing"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">{task.title}</h3>

            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                priorityColor[task.priority] ||
                "bg-slate-100 text-slate-700"
              }`}
            >
              {task.priority}
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            {task.description || "No description"}
          </p>

          <div className="mt-4 flex justify-between text-xs text-slate-500">
            <span>👤 {task.assigned_to_name || "Unassigned"}</span>

            <span>
              📅{" "}
              {task.due_date
                ? new Date(task.due_date).toLocaleDateString()
                : "-"}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;
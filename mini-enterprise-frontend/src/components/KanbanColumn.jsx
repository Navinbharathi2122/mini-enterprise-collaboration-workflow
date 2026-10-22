import { Droppable, Draggable } from "@hello-pangea/dnd";

function KanbanColumn({ title, columnId, tasks }) {
  return (
    <div className="bg-slate-100 rounded-2xl p-4 shadow min-h-[500px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg text-slate-800">{title}</h2>

        <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold shadow">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-[420px] rounded-xl transition ${
              snapshot.isDraggingOver ? "bg-blue-50" : ""
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable
                draggableId={String(task.id)}
                index={index}
                key={task.id}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`rounded-xl bg-white border p-4 shadow-sm transition ${
                      snapshot.isDragging
                        ? "rotate-2 shadow-xl border-blue-500"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-slate-800">
                        {task.title}
                      </h3>

                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {task.priority}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mb-3">
                      {task.description}
                    </p>

                    <div className="text-xs text-slate-400">
                      Assigned : {task.assigned_to_name || "Unassigned"}
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      Due :{" "}
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "No Due Date"}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default KanbanColumn;
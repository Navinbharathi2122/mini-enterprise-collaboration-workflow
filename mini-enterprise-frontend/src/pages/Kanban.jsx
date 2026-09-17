import { useEffect, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import KanbanColumn from "../components/KanbanColumn";

import {
  getKanbanTasks,
  updateKanbanStatus,
} from "../services/kanbanService";

function Kanban() {
  const [board, setBoard] = useState({
    todo: [],
    in_progress: [],
    review: [],
    done: [], // ✅ FIXED
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    try {
      setLoading(true);

      const data = await getKanbanTasks();

      setBoard({
        todo: data.todo || [],
        in_progress: data.in_progress || [],
        review: data.review || [],
        done: data.done || [], // ✅ FIXED
      });
    } catch (error) {
      console.error("Error loading Kanban Board:", error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const startColumn = Array.from(board[source.droppableId]);
    const finishColumn = Array.from(board[destination.droppableId]);

    const movedTask = startColumn[source.index];

    startColumn.splice(source.index, 1);

    const updatedTask = {
      ...movedTask,
      status: destination.droppableId,
    };

    finishColumn.splice(destination.index, 0, updatedTask);

    setBoard((prev) => ({
      ...prev,
      [source.droppableId]: startColumn,
      [destination.droppableId]: finishColumn,
    }));

    try {
      await updateKanbanStatus(
        movedTask.id,
        destination.droppableId
      );

      fetchBoard();
    } catch (error) {
      alert(
        error.response?.data?.detail ||
          "Workflow transition is not allowed."
      );

      fetchBoard();
    }
  };

  const totalTasks =
    board.todo.length +
    board.in_progress.length +
    board.review.length +
    board.done.length; // ✅ FIXED

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Kanban Workflow Board
              </h1>

              <p className="mt-2 text-slate-500">
                Drag and drop tasks through the enterprise workflow lifecycle.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 px-5 py-3 text-white shadow-md">
              <p className="text-xs uppercase tracking-widest text-slate-300">
                Total Tasks
              </p>

              <h2 className="text-2xl font-bold">{totalTasks}</h2>
            </div>
          </div>

          {/* Workflow Summary */}
          <div className="mb-8 grid gap-5 md:grid-cols-4">

            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
              <p className="text-sm text-yellow-700">TODO</p>
              <h3 className="mt-2 text-3xl font-bold text-yellow-800">
                {board.todo.length}
              </h3>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm text-blue-700">IN PROGRESS</p>
              <h3 className="mt-2 text-3xl font-bold text-blue-800">
                {board.in_progress.length}
              </h3>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
              <p className="text-sm text-purple-700">REVIEW</p>
              <h3 className="mt-2 text-3xl font-bold text-purple-800">
                {board.review.length}
              </h3>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <p className="text-sm text-green-700">DONE</p>
              <h3 className="mt-2 text-3xl font-bold text-green-800">
                {board.done.length}
              </h3>
            </div>

          </div>

          {/* Kanban Board */}
          {loading ? (
            <div className="flex h-[500px] items-center justify-center rounded-2xl bg-white shadow-sm">
              <p className="text-lg text-slate-500">
                Loading Kanban Board...
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="overflow-x-auto pb-6">
                <div className="flex min-w-[1280px] gap-6">

                  <KanbanColumn
                    title="🟡 TODO"
                    columnId="todo"
                    color="bg-yellow-500"
                    tasks={board.todo}
                  />

                  <KanbanColumn
                    title="🔵 IN PROGRESS"
                    columnId="in_progress"
                    color="bg-blue-600"
                    tasks={board.in_progress}
                  />

                  <KanbanColumn
                    title="🟣 REVIEW"
                    columnId="review"
                    color="bg-purple-600"
                    tasks={board.review}
                  />

                  <KanbanColumn
                    title="🟢 DONE"
                    columnId="done" // ✅ FIXED
                    color="bg-green-600"
                    tasks={board.done} // ✅ FIXED
                  />

                </div>
              </div>
            </DragDropContext>
          )}

          {/* Workflow Information */}
          <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Enterprise Workflow Lifecycle
              </h2>

              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                Phase 2
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-4">

              <div className="rounded-xl bg-yellow-50 p-4 text-center">
                <div className="mb-2 text-3xl">🟡</div>
                <p className="font-semibold text-yellow-700">TODO</p>
                <p className="mt-1 text-xs text-slate-500">
                  Task created and waiting to start.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <div className="mb-2 text-3xl">🔵</div>
                <p className="font-semibold text-blue-700">
                  IN PROGRESS
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Employee is actively working.
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-4 text-center">
                <div className="mb-2 text-3xl">🟣</div>
                <p className="font-semibold text-purple-700">
                  REVIEW
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Waiting for Manager/Admin review.
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-4 text-center">
                <div className="mb-2 text-3xl">🟢</div>
                <p className="font-semibold text-green-700">
                  DONE
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Task successfully completed.
                </p>
              </div>

            </div>
          </div>

          {/* Workflow Rules */}
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Workflow Rules
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="font-semibold text-green-700">
                  Allowed Transitions
                </p>

                <ul className="mt-2 space-y-1 text-sm text-green-700">
                  <li>✅ TODO → IN PROGRESS</li>
                  <li>✅ IN PROGRESS → REVIEW</li>
                  <li>✅ REVIEW → DONE</li>
                </ul>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-700">
                  Blocked Transitions
                </p>

                <ul className="mt-2 space-y-1 text-sm text-red-700">
                  <li>❌ TODO → DONE</li>
                  <li>❌ TODO → REVIEW</li>
                  <li>❌ IN PROGRESS → DONE</li>
                  <li>❌ REVIEW → TODO</li>
                </ul>
              </div>

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default Kanban;
import api from "./axios";

// Get Kanban Board
export const getKanbanTasks = async () => {
  const response = await api.get("/tasks/kanban");
  return response.data;
};

// Update Task Status (Drag & Drop)
export const updateKanbanStatus = async (taskId, status) => {
  const response = await api.patch(`/tasks/${taskId}/status`, {
    status,
  });

  return response.data;
};
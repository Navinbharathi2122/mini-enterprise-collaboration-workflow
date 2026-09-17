import api from "./axios";

// Get All Tasks
export const getAllTasks = async () => {
  const response = await api.get("/tasks/");
  return response.data;
};

// Create Task
export const createTask = async (taskData) => {
  const response = await api.post("/tasks/", taskData);
  return response.data;
};

// Update Task
export const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

// Delete Task
export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// Get Single Task
export const getTaskById = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

// Kanban Board
export const getKanbanBoard = async () => {
  const response = await api.get("/tasks/kanban");
  return response.data;
};

// Kanban Status Update
export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/tasks/${taskId}/status`, {
    status,
  });

  return response.data;
};
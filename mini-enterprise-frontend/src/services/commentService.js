import api from "./axios";


export const getTaskComments = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
};

export const addTaskComment = async (taskId, commentData) => {
  const response = await api.post(
    `/tasks/${taskId}/comments`,
    commentData
  );

  return response.data;
};
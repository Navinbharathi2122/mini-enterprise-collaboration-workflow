import api from "./axios";

// Get All Leave Requests
export const getAllLeaveRequests = async () => {
  const response = await api.get("/api/leaves");
  return response.data;
};

// Create Leave Request
export const createLeaveRequest = async (leaveData) => {
  const response = await api.post("/api/leaves", leaveData);
  return response.data;
};

// Leave Action
export const takeLeaveAction = async (leaveId, actionData) => {
  const response = await api.patch(
    `/api/leaves/${leaveId}/action`,
    actionData
  );
  return response.data;
};

// Leave History
export const getLeaveHistory = async (leaveId) => {
  const response = await api.get(`/api/leaves/${leaveId}/history`);
  return response.data;
};
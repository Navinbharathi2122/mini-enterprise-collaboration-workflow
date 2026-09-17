import api from "./axios";

// Get all approvals
export const getAllApprovals = async () => {
  const response = await api.get("/approvals/");
  return response.data;
};

// Create approval request
export const createApproval = async (approvalData) => {
  const response = await api.post("/approvals/", approvalData);
  return response.data;
};

// Take approval action (Approve / Reject / Hold)
export const takeApprovalAction = async (approvalId, actionData) => {
  const response = await api.patch(
    `/approvals/${approvalId}/action`,
    actionData
  );
  return response.data;
};

// Approval history
export const getApprovalHistory = async (approvalId) => {
  const response = await api.get(`/approvals/${approvalId}/history`);
  return response.data;
};
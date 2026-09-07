import api from "./axios";


export const getAllUsers = async () => {
  const response = await api.get("/users/");
  return response.data;
};


export const createUser = async (userData) => {
  const response = await api.post("/users/", userData);
  return response.data;
};


export const updateUser = async (id, userData) => {
  try {
   
    if (!userData.password || userData.password.trim() === "") {
      delete userData.password;
    }

    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    console.error("Update User Error:", error);
    throw error;
  }
};


export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
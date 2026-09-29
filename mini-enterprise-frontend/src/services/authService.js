

import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  localStorage.clear();

  localStorage.setItem("access_token", response.data.access_token);
  localStorage.setItem("user", JSON.stringify(response.data.user));

  return response.data;
};



export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


export const getCurrentUser = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


export const updateProfile = async (profileData) => {
  try {
    const response = await api.put("/users/me", profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


export const changePassword = async (passwordData) => {
  try {
    const response = await api.put("/users/change-password", passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


export const getToken = () => {
  return localStorage.getItem("access_token");
};

export const isLoggedIn = () => {
  return !!localStorage.getItem("access_token");
};


export const logoutUser = () => {
  localStorage.clear();
};

// Export Axios Instance
export default api;
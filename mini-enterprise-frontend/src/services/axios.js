
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    Accept: "application/json",
  },
});

let auth0TokenGetter = null;

export const setAuth0TokenGetter = (getter) => {
  auth0TokenGetter = typeof getter === "function" ? getter : null;
};

api.interceptors.request.use(
  async (config) => {
    // Keep an explicitly supplied Authorization header.
    if (config.headers?.Authorization) {
      return config;
    }

    if (typeof auth0TokenGetter !== "function") {
      throw new Error("Auth0 token getter is not configured.");
    }

    const token = await auth0TokenGetter();

    if (!token) {
      throw new Error("Auth0 access token is missing.");
    }

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;


api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) error.userMessage = "Your session is invalid or expired. Sign in again.";
    else if (status === 403) error.userMessage = "You do not have permission to perform this action.";
    else if (status === 429) error.userMessage = "Too many requests. Please wait and try again.";
    else if (!error.response) error.userMessage = "Cannot reach the server. Check your connection and try again.";
    return Promise.reject(error);
  }
);

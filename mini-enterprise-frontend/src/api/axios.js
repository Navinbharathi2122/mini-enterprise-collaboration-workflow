import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Auth0 access-token getter is registered by AuthTokenProvider in App.jsx.
let auth0TokenGetter = null;

export function setAuth0TokenGetter(getter) {
  auth0TokenGetter = getter;
}

// Attach the Auth0 access token to backend requests.
api.interceptors.request.use(
  async (config) => {
    if (auth0TokenGetter) {
      const token = await auth0TokenGetter();

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
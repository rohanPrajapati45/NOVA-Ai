import axios from "axios";

// Pre-configured axios instance for all API calls
// withCredentials: true is required so the browser sends/receives session cookies
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

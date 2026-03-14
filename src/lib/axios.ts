import axios from "axios";

// This automatically switches between Localhost and your Ngrok URL!
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: {
    "ngrok-skip-browser-warning": "69420", // 🔥 Bypasses Ngrok's warning page
    "Content-Type": "application/json",
  },
});

export default api;

import { CustomError } from "@/types/custom-error.type";
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api",  // URL de votre backend
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour gérer les erreurs
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default API;

import { useMutation } from "@tanstack/react-query";
import axios from "axios";

interface TaskFeatures {
  descriptionLength: number;
  hasDueDate: boolean;
  daysUntilDue: number;
  assignedToWorkload: number;
  projectProgress: number;
  taskDependencies: number;
}

interface PredictionResponse {
  priority: string;
  confidence: number;
  status: string;
  error?: string;
}

export const useTaskPriorityPrediction = () => {
  return useMutation<PredictionResponse, Error, TaskFeatures>({
    mutationFn: async (features: TaskFeatures) => {
      try {
        const response = await axios.post<PredictionResponse>(
          "http://localhost:3000/api/task-priority",
          features
        );
        if (response.data.status !== 'success') {
          throw new Error(response.data.error || 'Failed to predict task priority');
        }
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Prediction API Error:', error.response?.data || error.message);
          throw new Error(error.response?.data?.error || 'Failed to predict task priority');
        }
        throw error;
      }
    },
  });
}; 
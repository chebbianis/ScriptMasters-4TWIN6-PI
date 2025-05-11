export const API_URL = "http://localhost:3000";

export const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

export const TASK_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export const TASK_TYPE = {
  BUG: "BUG",
  FEATURE: "FEATURE",
  TASK: "TASK",
} as const;

export const USER_ROLE = {
  ADMIN: "ADMIN",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  DEVELOPER: "DEVELOPER",
} as const;

export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_UPDATED: "TASK_UPDATED",
  TASK_COMPLETED: "TASK_COMPLETED",
  PROJECT_UPDATED: "PROJECT_UPDATED",
} as const; 
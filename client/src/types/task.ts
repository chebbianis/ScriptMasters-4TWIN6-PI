export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  reminder?: boolean;
  project: {
    name: string;
    emoji: string;
  };
} 
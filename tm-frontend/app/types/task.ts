import { ApiResponse } from "./api";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  deadline: string | null;
  priority: PriorityLevel;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskWithId = ApiResponse<TaskItem>;

export type TaskList = {
  message: string;
  data: {
    tasks: TaskItem[];
    totalPage: number;
    totalTask: number;
    page: number;
  };
};

export type CreateTaskFormData = {
  title: string;
  description?: string;
  priority: PriorityLevel;
  deadlineDate?: string;
  deadlineTime?: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  priority: PriorityLevel;
  deadline?: string;
};

export type UpdateTaskFormData = Partial<CreateTaskFormData>;

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export type CreateTaskResponse = {
  message: string;
  data: TaskItem;
};

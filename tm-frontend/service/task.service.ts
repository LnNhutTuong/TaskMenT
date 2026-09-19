import { api } from "../lib/axios";
import type {
  TaskList,
  CreateTaskPayload,
  CreateTaskResponse,
  TaskItem,
  TaskWithId,
} from "../app/types/task";

export const getAllTasks = () => {
  return api.get<TaskList["data"]>("/task/all", {
    params: {
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
  });
};

export const getTaskWithId = (taskId: string) => {
  return api.get<TaskWithId>(`/task/${taskId}`);
};

export const createTask = (payload: CreateTaskPayload) => {
  return api.post<CreateTaskResponse>("/task/create", payload);
};

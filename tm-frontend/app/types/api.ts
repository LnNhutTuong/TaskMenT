export type ApiResponse<T> = {
  message: string;
  data: T;
};
export type ApiErrorResponse = {
  message: string;
  statusCode: number;
};

import { ApiErrorResponse } from "@/app/types/api";

export async function apiFetch<T>(apiUrl: string, option?: RequestInit) {
  const token = localStorage.getItem("accessToken");

  const header = {
    ...option?.headers, // copy lai phuong thuc
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // dua token vao trong header: authorization
  };

  const response = await fetch(apiUrl, { ...option, headers: header });

  if (!response.ok) {
    const error = (await response.json()) as ApiErrorResponse;
    throw new Error(error.message);
  }

  const data = (await response.json()) as T;
  return data;
}

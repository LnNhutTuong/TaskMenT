import { LoginFromData, LoginResponse, AuthUser } from "@/app/types/auth";
import { api } from "@/lib/axios";

export const login = (payload: LoginFromData) => {
  return api.post<LoginResponse>("/auth/login", payload);
};

export const getMe = () => {
  return api.get<AuthUser>("/auth/me");
};

import { ApiResponse } from "./api";

export type LoginFromData = {
  email: string;
  password: string;
};

export type AuthUser = {
  email: string;
  name: string | null;
};

export type LoginData = {
  accessToken: string;
  user: AuthUser;
};

export type LoginResponse = ApiResponse<LoginData>;

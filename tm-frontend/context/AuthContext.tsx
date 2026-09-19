"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthUser } from "@/app/types/auth";
import { getMe } from "@/service/auth.service";

type AuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setIsAuthLoading(false);
      return;
    }

    setAccessToken(token);
    handleGetMe();
  }, []);

  const login = (token: string, user: AuthUser) => {
    localStorage.setItem("accessToken", token);

    setAccessToken(token);
    setUser(user);
  };

  const handleGetMe = async () => {
    try {
      const response = await getMe();
      setUser(response);
    } catch {
      localStorage.removeItem("accessToken");
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isAuthenticated: Boolean(accessToken),
        isAuthLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

//cai thang nay la custom hook de de su dung context
export const useAuth = () => {
  const context = useContext(AuthContext); // khai bao context

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

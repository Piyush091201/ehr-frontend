"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setToken, clearToken, getToken } from "./api";
import type { AuthResponse, UserInfo, Role } from "./types";

interface AuthContextValue {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserInfo>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = "ehr_user";

/** Where each role lands after login. */
export function homePathForRole(role: Role): string {
  return role === "Patient" ? "/portal" : "/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const stored = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
    if (token && stored) {
      setUser(JSON.parse(stored) as UserInfo);
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<UserInfo> {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    setToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  }

  function logout() {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

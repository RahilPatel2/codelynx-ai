"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  authProvider?: "credentials" | "google";
  subscription?: {
    plan: "FREE" | "PROFESSIONAL" | "PRO" | string;
    status: "active" | "canceled" | "past_due" | string;
    priceInr?: number;
    currency?: string;
    purchaseMode?: string;
    activatedAt?: string;
  };
  createdAt?: string;
  bio?: string;
  role?: string;
  company?: string;
  githubHandle?: string;
  status?: string;
  preferences?: {
    theme: "dark" | "light" | "system";
    defaultLanguage: string;
    fontSize: number;
    minimap: boolean;
    wordWrap: boolean;
    aiModel: string;
    verbosity: "concise" | "balanced" | "detailed";
  };
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  demoLogin: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (data: Partial<UserSession>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  demoLogin: async () => {},
  refreshSession: async () => {},
  updateProfile: async () => ({ success: false }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (email: string, pass: string, rememberMe: boolean = true) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Authentication failed" };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // ignore
    }
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  const demoLogin = async () => {
    const res = await login("demo@codelynx.ai", "Password123!");
    if (res.success) {
      router.push("/dashboard");
    }
  };

  const updateProfile = async (data: Partial<UserSession>) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || "Failed to update profile" };
      }

      if (result.user) {
        setUser((prev) => (prev ? { ...prev, ...result.user } : result.user));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        demoLogin,
        refreshSession,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

"use client";

import { fetchProfile } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { ProfileWithCrew } from "@/lib/database.types";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthContextType = {
  sessionToken: string | null;
  profile: ProfileWithCrew | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  sessionToken: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileWithCrew | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    // session_tokenでプロフィール取得
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: userId }),
      });
      const data = await res.json();
      setProfile(data.profile || null);
    } catch (e) {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (sessionToken) {
      await loadProfile(sessionToken);
    }
  };

  useEffect(() => {
    // session_tokenをlocalStorageから取得
    const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
    if (token) {
      setSessionToken(token);
      loadProfile(token).finally(() => setIsLoading(false));
    } else {
      setSessionToken(null);
      setProfile(null);
      setIsLoading(false);
    }
  }, []);

  // ログアウト
  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("session_token");
    }
    setSessionToken(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ sessionToken, profile, isLoading, refreshProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

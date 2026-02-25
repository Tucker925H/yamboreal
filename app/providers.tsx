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
  user: User | null;
  profile: ProfileWithCrew | null;
  isLoading: boolean;
  isAnonymous: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAnonymous: false,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileWithCrew | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await fetchProfile(userId);
    console.log("fetchProfile データ:", data);
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    // 現在のセッションを取得
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
        setIsLoading(false);
      } else {
        // 未ログインなら匿名ログイン
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous sign in error:", error);
        } else {
          setUser(data.user);
          if (data.user) {
            await loadProfile(data.user.id);
          }
        }
        setIsLoading(false);
      }
    };

    getSession();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAnonymous = user?.is_anonymous ?? false;

  return (
    <AuthContext.Provider
      value={{ user, profile, isLoading, isAnonymous, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

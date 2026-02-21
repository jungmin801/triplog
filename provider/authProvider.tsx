// providers/AuthProvider.tsx

import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1️⃣ 앱 시작 시 기존 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    // 2️⃣ 로그인/로그아웃 이벤트 구독
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session ?? null);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

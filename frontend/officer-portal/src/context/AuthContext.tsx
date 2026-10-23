import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types/api";

interface AuthContextValue { user: User | null; loading: boolean; signIn: (email: string, role: string, bureau?: string) => Promise<void>; signOut: () => void; }
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const restore = async () => { if (localStorage.getItem("caselink_token")) { try { setUser(await api.me()); } catch { localStorage.removeItem("caselink_token"); } } setLoading(false); };
    void restore();
    const expire = () => { setUser(null); };
    window.addEventListener("caselink:session-expired", expire);
    return () => window.removeEventListener("caselink:session-expired", expire);
  }, []);
  const value = useMemo(() => ({
    user, loading,
    signIn: async (email: string, role: string, bureau?: string) => { const result = await api.login({ email, role, bureau_code: bureau }); localStorage.setItem("caselink_token", result.access_token); setUser(result.user); },
    signOut: () => { localStorage.removeItem("caselink_token"); setUser(null); },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context; };

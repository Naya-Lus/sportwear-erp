import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getUserByEmail } from "./db";

type User = { email: string; name: string; user_id: string; role: string };
type AuthCtx = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "sportwear_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const login = async (email: string, password: string) => {
    if (!email || !password) throw new Error("Email and password are required");

    // Try Supabase Users table first
    const dbUser = await getUserByEmail(email.trim());
    if (dbUser) {
      if (dbUser.password !== password) throw new Error("Invalid credentials");
      const next: User = {
        email: dbUser.email,
        name: dbUser.full_name,
        user_id: dbUser.user_id,
        role: dbUser.role,
      };
      setUser(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return;
    }

    // Fallback demo mode
    if (password.length < 4) throw new Error("Invalid credentials");
    const next: User = {
      email,
      name: email.split("@")[0] || "Admin",
      user_id: "00000000-0000-0000-0000-000000000000",
      role: "admin",
    };
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!hydrated) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

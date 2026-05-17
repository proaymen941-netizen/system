import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Employee {
  id: number;
  username: string;
  name: string;
  nameAr: string | null;
  role: string;
  department: string | null;
  position: string | null;
  status: string;
}

interface AuthContextType {
  employee: Employee | null;
  token: string | null;
  isLoading: boolean;
  setToken: (token: string, emp?: Employee) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  employee: null,
  token: null,
  isLoading: true,
  setToken: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem("auth_token"));
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!localStorage.getItem("auth_token"));

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (!storedToken) { setIsLoading(false); return; }
    setIsLoading(true);
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(async (res) => {
        if (!res.ok) { localStorage.removeItem("auth_token"); setTokenState(null); return; }
        const emp = await res.json();
        setEmployee(emp);
        setTokenState(storedToken);
      })
      .catch(() => { localStorage.removeItem("auth_token"); setTokenState(null); })
      .finally(() => setIsLoading(false));
  }, []);

  const setToken = (t: string, emp?: Employee) => {
    localStorage.setItem("auth_token", t);
    setTokenState(t);
    if (emp) setEmployee(emp);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setTokenState(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ employee, token, isLoading, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

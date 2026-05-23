import React, { createContext, useContext, useEffect, useState } from "react";
import { User, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        setState({
          user,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
        setAuthTokenGetter(() => storedToken);
      } else {
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        setAuthTokenGetter(null);
      }
    } catch (e) {
      console.error("Failed to restore auth state", e);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      setAuthTokenGetter(null);
    }
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setAuthTokenGetter(() => token);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuthTokenGetter(null);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

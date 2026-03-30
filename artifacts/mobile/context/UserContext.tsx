import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getApiBase } from "@/utils/api";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  register: (firstName: string, lastName: string, email: string) => Promise<void>;
  updateProfile: (firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | null>(null);

const USER_KEY = "@invoice_app/user_profile";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setUser({ email: "", firstName: "", lastName: "", ...parsed });
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const register = useCallback(async (
    firstName: string,
    lastName: string,
    email: string,
  ) => {
    const emailKey = email.trim().toLowerCase();
    const res = await fetch(`${getApiBase()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailKey,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: "",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Registration failed.");

    const profile: UserProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailKey,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }, []);

  const updateProfile = useCallback(async (
    firstName: string,
    lastName: string,
  ) => {
    if (!user?.email) return;
    try {
      await fetch(`${getApiBase()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: "",
        }),
      });
    } catch {}

    const profile: UserProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: user.email,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }, [user]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, register, updateProfile, logout }),
    [user, isLoading, register, updateProfile, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

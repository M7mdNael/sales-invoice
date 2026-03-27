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
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  workspaceId: string;
  inviteCode: string;
}

interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  register: (phone: string, firstName: string, lastName: string, email: string) => Promise<void>;
  updateProfile: (phone: string, firstName: string, lastName: string, email: string) => Promise<void>;
  joinWorkspace: (inviteCode: string) => Promise<void>;
  refreshWorkspace: () => Promise<void>;
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
          setUser({ email: "", workspaceId: "", inviteCode: "", ...parsed });
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const register = useCallback(async (
    phone: string,
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
        phone: phone.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Registration failed.");

    const profile: UserProfile = {
      phone: phone.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailKey,
      workspaceId: data.workspaceId ?? "",
      inviteCode: data.inviteCode ?? "",
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }, []);

  const updateProfile = useCallback(async (
    phone: string,
    firstName: string,
    lastName: string,
    email: string,
  ) => {
    const emailKey = email.trim().toLowerCase();
    try {
      await fetch(`${getApiBase()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailKey,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      });
    } catch {}

    const profile: UserProfile = {
      phone: phone.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailKey,
      workspaceId: user?.workspaceId ?? "",
      inviteCode: user?.inviteCode ?? "",
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }, [user]);

  const joinWorkspace = useCallback(async (inviteCode: string) => {
    if (!user?.email) throw new Error("Not logged in.");
    const res = await fetch(`${getApiBase()}/api/workspace/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, inviteCode: inviteCode.trim().toUpperCase() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to join workspace.");
    const updated: UserProfile = {
      ...user,
      workspaceId: data.workspaceId ?? user.workspaceId,
      inviteCode: data.inviteCode ?? user.inviteCode,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  const refreshWorkspace = useCallback(async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${getApiBase()}/api/auth/profile?email=${encodeURIComponent(user.email)}`);
      if (!res.ok) return;
      const data = await res.json();
      const updated: UserProfile = {
        ...user,
        workspaceId: data.workspaceId ?? user.workspaceId,
        inviteCode: data.inviteCode ?? user.inviteCode,
      };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
      setUser(updated);
    } catch {}
  }, [user]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, register, updateProfile, joinWorkspace, refreshWorkspace, logout }),
    [user, isLoading, register, updateProfile, joinWorkspace, refreshWorkspace, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

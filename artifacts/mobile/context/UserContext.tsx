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

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  isAdmin: boolean;
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
const DEVICE_ID_KEY = "@invoice_app/device_id";

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const newId = generateUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setUser({ email: "", firstName: "", lastName: "", employeeId: "", isAdmin: false, ...parsed });
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
    const deviceId = await getOrCreateDeviceId();

    const res = await fetch(`${getApiBase()}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailKey,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        employeeId: deviceId,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Registration failed.");

    const profile: UserProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailKey,
      employeeId: data.employeeId ?? deviceId,
      isAdmin: data.isAdmin ?? false,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }, []);

  const updateProfile = useCallback(async (
    firstName: string,
    lastName: string,
  ) => {
    if (!user?.email) return;
    const deviceId = await getOrCreateDeviceId();

    try {
      const res = await fetch(`${getApiBase()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          employeeId: deviceId,
        }),
      });
      const data = await res.json();
      const profile: UserProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: user.email,
        employeeId: data.employeeId ?? user.employeeId,
        isAdmin: data.isAdmin ?? user.isAdmin,
      };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
      setUser(profile);
    } catch {
      const profile: UserProfile = { ...user, firstName: firstName.trim(), lastName: lastName.trim() };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
      setUser(profile);
    }
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

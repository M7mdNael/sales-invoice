import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface UserProfile {
  phone: string;
  firstName: string;
  lastName: string;
}

interface UserContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  register: (phone: string, firstName: string, lastName: string) => Promise<void>;
  updateProfile: (phone: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

const USER_KEY = "@invoice_app/user_profile";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY).then((raw) => {
      if (raw) {
        try {
          setUser(JSON.parse(raw));
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const register = useCallback(async (phone: string, firstName: string, lastName: string) => {
    const profile: UserProfile = { phone: phone.trim(), firstName: firstName.trim(), lastName: lastName.trim() };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }, []);

  const updateProfile = useCallback(async (phone: string, firstName: string, lastName: string) => {
    const profile: UserProfile = { phone: phone.trim(), firstName: firstName.trim(), lastName: lastName.trim() };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }, []);

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

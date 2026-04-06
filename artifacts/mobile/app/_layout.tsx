import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { UserProvider, useUser } from "@/context/UserContext";
import OnboardingScreen from "./onboarding";
import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl("https://942ccd4c-7cec-4401-9f18-3c2f4f27e8da-00-21p7gpcxv9k13.pike.replit.dev");

import { setBaseUrl } from "@workspace/api-client-react";

setBaseUrl("https://942ccd4c-7cec-4401-9f18-3c2f4f27e8da-00-21p7gpcxv9k13.pike.replit.dev");

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FFFFFF" },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 17,
          color: "#111827",
        },
        headerTintColor: "#1A73E8",
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: "#F8FAFC" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="invoice/create"
        options={{ title: "New Invoice", presentation: "modal" }}
      />
      <Stack.Screen
        name="invoice/[id]"
        options={{ title: "Invoice Details" }}
      />
      <Stack.Screen
        name="return/create"
        options={{ title: "New Return", presentation: "modal" }}
      />
      <Stack.Screen
        name="return/[id]"
        options={{ title: "Return Details" }}
      />
      <Stack.Screen
        name="products/index"
        options={{ title: "Products" }}
      />
      <Stack.Screen
        name="companies/index"
        options={{ title: "Companies" }}
      />
      <Stack.Screen
        name="companies/[id]"
        options={{ title: "Company Details" }}
      />
      <Stack.Screen
        name="settings/index"
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="team/index"
        options={{ title: "Team" }}
      />
      <Stack.Screen
        name="trash"
        options={{ title: "Trash" }}
      />
    </Stack>
  );
}

function AppGate() {
  const { user, isLoading } = useUser();
  if (isLoading) return null;
  if (!user) return <OnboardingScreen />;
  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <UserProvider>
              <AppProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <AppGate />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </AppProvider>
            </UserProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

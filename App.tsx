import React, { useEffect, useRef, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator, AppState } from "react-native";
import { NavigationContainer, NavigationState } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";
import * as ScreenCapture from "expo-screen-capture";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NexaSafeProvider, useNexaSafe } from "@/contexts/NexaSafeContext";
import { useTheme } from "@/hooks/useTheme";
import { NexaVaultColors } from "@/constants/theme";

import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper to get current route name from navigation state
function getActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name;
}

// ----------------------------------------------------
// Internal Component – Your main app content
// ----------------------------------------------------
function AppContent() {
  const { isLoading, requireReauth, logout, hasCompletedOnboarding } = useAuth();
  const { theme, isDark } = useTheme();
  const {
    startSession,
    endSession,
    setScreenRecordingDetected,
    setLogoutCallback,
    isSessionActive,
    trackScreenVisit,
  } = useNexaSafe();

  // Track previous route for NexaSafe screen tracking
  const routeNameRef = useRef<string | undefined>(undefined);

  // Handle navigation state changes for NexaSafe tracking
  const handleNavigationStateChange = useCallback((state: NavigationState | undefined) => {
    const currentRouteName = getActiveRouteName(state);
    const previousRouteName = routeNameRef.current;

    if (currentRouteName && currentRouteName !== previousRouteName && isSessionActive) {
      trackScreenVisit(currentRouteName);
      console.log(`📱 NexaSafe tracking screen: ${currentRouteName}`);
    }

    routeNameRef.current = currentRouteName;
  }, [isSessionActive, trackScreenVisit]);

  // 🔒 SECURITY: Block screen recording and screenshots globally
  useEffect(() => {
    const enableScreenSecurity = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        console.log("🔒 Screen capture prevention enabled globally");
      } catch (error) {
        console.warn("Failed to enable screen capture prevention:", error);
        // If prevention fails, mark as potential screen recording
        setScreenRecordingDetected(true);
      }
    };

    enableScreenSecurity();

    // Keep it enabled throughout the app lifecycle
    return () => {
      // Don't disable on unmount - keep protection active
    };
  }, [setScreenRecordingDetected]);

  // 🛡️ NexaSafe: Set logout callback
  useEffect(() => {
    setLogoutCallback(() => {
      console.log("🚪 NexaSafe triggered logout due to suspicious activity");
      logout();
    });
  }, [setLogoutCallback, logout]);

  // 🛡️ NexaSafe: Start session when user is authenticated
  useEffect(() => {
    if (hasCompletedOnboarding && !isLoading && !isSessionActive) {
      startSession();
      console.log("🛡️ NexaSafe session started for authenticated user");
    }
  }, [hasCompletedOnboarding, isLoading, isSessionActive, startSession]);

  // 🔥 CRUCIAL: Ask for PIN every time the app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        console.log("📲 App returned to foreground → Reauth required");
        requireReauth();

        // Re-enable screen capture prevention when app becomes active
        ScreenCapture.preventScreenCaptureAsync().catch(console.warn);
      }
    });

    return () => sub.remove();
  }, [requireReauth]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <ActivityIndicator size="large" color={NexaVaultColors.primary} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer onStateChange={handleNavigationStateChange}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}


// ----------------------------------------------------
// Main App Component
// ----------------------------------------------------
export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <LanguageProvider>
              <AuthProvider>
                <NexaSafeProvider>
                  <AppContent />
                </NexaSafeProvider>
              </AuthProvider>
            </LanguageProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}


// ----------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

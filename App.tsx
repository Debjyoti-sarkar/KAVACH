import React, { useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { NexaVaultColors } from "@/constants/theme";

import AsyncStorage from "@react-native-async-storage/async-storage";

// ----------------------------------------------------
// Internal Component – Your main app content
// ----------------------------------------------------
function AppContent() {
  const { isLoading, requireReauth } = useAuth();
  const { theme, isDark } = useTheme();

  // 🔥 CRUCIAL: Ask for PIN every time the app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        console.log("📲 App returned to foreground → Reauth required");
        requireReauth();
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
      <NavigationContainer>
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
                <AppContent />
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

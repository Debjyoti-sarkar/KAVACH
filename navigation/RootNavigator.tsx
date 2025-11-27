import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

import LanguageSelectionScreen from "@/screens/LanguageSelectionScreen";
import PhoneVerificationScreen from "@/screens/PhoneVerificationScreen";
import BankLinkingScreen from "@/screens/BankLinkingScreen";
import SecuritySetupScreen from "@/screens/SecuritySetupScreen";
import LoginScreen from "@/screens/LoginScreen";
import DashboardScreen from "@/screens/DashboardScreen";
import SendMoneyScreen from "@/screens/SendMoneyScreen";
import QRScannerScreen from "@/screens/QRScannerScreen";
import FraudScanScreen from "@/screens/FraudScanScreen";
import BalanceScreen from "@/screens/BalanceScreen";
import TransactionHistoryScreen from "@/screens/TransactionHistoryScreen";
import OfflineOtpScreen from "@/screens/OfflineOtpScreen";
import VoiceAssistantScreen from "@/screens/VoiceAssistantScreen";
import SOSScreen from "@/screens/SOSScreen";
import SettingsScreen from "@/screens/SettingsScreen";

export type RootStackParamList = {
  LanguageSelection: undefined;
  PhoneVerification: undefined;
  BankLinking: undefined;
  SecuritySetup: undefined;
  Login: undefined;
  Dashboard: undefined;
  SendMoney: { recipient?: string; amount?: string } | undefined;
  QRScanner: undefined;
  FraudScan: undefined;
  Balance: undefined;
  TransactionHistory: undefined;
  OfflineOtp: undefined;
  VoiceAssistant: undefined;
  SOS: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme, isDark } = useTheme();
  const { authStep, hasCompletedOnboarding } = useAuth();

  const getInitialRoute = (): keyof RootStackParamList => {
    if (!hasCompletedOnboarding) {
      switch (authStep) {
        case "language_selection":
          return "LanguageSelection";
        case "phone_verification":
          return "PhoneVerification";
        case "bank_linking":
          return "BankLinking";
        case "security_setup":
          return "SecuritySetup";
        case "authenticated":
          return "Dashboard";
        default:
          return "LanguageSelection";
      }
    }
    
    if (authStep === "authenticated") {
      return "Dashboard";
    }
    
    return "Login";
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PhoneVerification"
        component={PhoneVerificationScreen}
        options={{ 
          headerTitle: "",
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="BankLinking"
        component={BankLinkingScreen}
        options={{ 
          headerTitle: "",
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="SecuritySetup"
        component={SecuritySetupScreen}
        options={{ 
          headerTitle: "",
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="NEXAVAULT" />,
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="SendMoney"
        component={SendMoneyScreen}
        options={{ headerTitle: "Send Money" }}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ 
          headerTitle: "Scan QR",
          presentation: "fullScreenModal",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="FraudScan"
        component={FraudScanScreen}
        options={{ headerTitle: "Scan for Fraud" }}
      />
      <Stack.Screen
        name="Balance"
        component={BalanceScreen}
        options={{ headerTitle: "Account Balance" }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ headerTitle: "Recent Activity" }}
      />
      <Stack.Screen
        name="OfflineOtp"
        component={OfflineOtpScreen}
        options={{ headerTitle: "Offline OTP" }}
      />
      <Stack.Screen
        name="VoiceAssistant"
        component={VoiceAssistantScreen}
        options={{ 
          headerTitle: "Voice Assistant",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="SOS"
        component={SOSScreen}
        options={{ 
          headerTitle: "Emergency",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: "Settings" }}
      />
    </Stack.Navigator>
  );
}

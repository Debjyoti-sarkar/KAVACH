import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthStep = 
  | "language_selection"
  | "phone_verification" 
  | "bank_linking"
  | "security_setup"
  | "authenticated";

interface UserData {
  phoneNumber: string;
  bankName: string;
  bankAccountMasked: string;
  pin: string;
  biometricEnabled: boolean;
  aadhaarLinked: boolean;
}

interface AuthContextType {
  authStep: AuthStep;
  userData: UserData | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  voiceGuideEnabled: boolean;
  isOnline: boolean;
  setAuthStep: (step: AuthStep) => void;
  setPhoneNumber: (phone: string) => Promise<void>;
  linkBank: (bankName: string, accountNumber: string) => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  enableBiometric: (enabled: boolean) => Promise<void>;
  linkAadhaar: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  toggleVoiceGuide: () => void;
  setOnlineStatus: (status: boolean) => void;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = "@nexavault_auth";
const USER_KEY = "@nexavault_user";
const ONBOARDING_KEY = "@nexavault_onboarding";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authStep, setAuthStepState] = useState<AuthStep>("language_selection");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [voiceGuideEnabled, setVoiceGuideEnabled] = useState(true);
  const [isOnline, setIsOnlineState] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [savedAuth, savedUser, savedOnboarding] = await Promise.all([
        AsyncStorage.getItem(AUTH_KEY),
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);

      if (savedOnboarding === "true") {
        setHasCompletedOnboarding(true);
        if (savedAuth === "authenticated" && savedUser) {
          setUserData(JSON.parse(savedUser));
          setAuthStepState("authenticated");
        } else {
          setAuthStepState("language_selection");
        }
      }
    } catch (error) {
      console.error("Failed to load auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthStep = useCallback((step: AuthStep) => {
    setAuthStepState(step);
  }, []);

  const setPhoneNumber = useCallback(async (phone: string) => {
    const newUserData: UserData = {
      phoneNumber: phone,
      bankName: "",
      bankAccountMasked: "",
      pin: "",
      biometricEnabled: false,
      aadhaarLinked: false,
    };
    setUserData(newUserData);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUserData));
  }, []);

  const linkBank = useCallback(async (bankName: string, accountNumber: string) => {
    if (!userData) return;
    const masked = "XXXX XXXX XXXX " + accountNumber.slice(-4);
    const newUserData = { ...userData, bankName, bankAccountMasked: masked };
    setUserData(newUserData);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUserData));
  }, [userData]);

  const setupPin = useCallback(async (pin: string) => {
    if (!userData) return;
    const newUserData = { ...userData, pin };
    setUserData(newUserData);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUserData));
  }, [userData]);

  const enableBiometric = useCallback(async (enabled: boolean) => {
    if (!userData) return;
    const newUserData = { ...userData, biometricEnabled: enabled };
    setUserData(newUserData);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUserData));
  }, [userData]);

  const linkAadhaar = useCallback(async () => {
    if (!userData) return;
    const newUserData = { ...userData, aadhaarLinked: true };
    setUserData(newUserData);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUserData));
  }, [userData]);

  const login = useCallback(async () => {
    setAuthStepState("authenticated");
    await AsyncStorage.setItem(AUTH_KEY, "authenticated");
  }, []);

  const logout = useCallback(async () => {
    setAuthStepState("language_selection");
    await AsyncStorage.removeItem(AUTH_KEY);
  }, []);

  const toggleVoiceGuide = useCallback(() => {
    setVoiceGuideEnabled(prev => !prev);
  }, []);

  const setOnlineStatus = useCallback((status: boolean) => {
    setIsOnlineState(status);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    await AsyncStorage.setItem(AUTH_KEY, "authenticated");
    setAuthStepState("authenticated");
  }, []);

  return (
    <AuthContext.Provider value={{
      authStep,
      userData,
      isLoading,
      hasCompletedOnboarding,
      voiceGuideEnabled,
      isOnline,
      setAuthStep,
      setPhoneNumber,
      linkBank,
      setupPin,
      enableBiometric,
      linkAadhaar,
      login,
      logout,
      toggleVoiceGuide,
      setOnlineStatus,
      completeOnboarding,
    }}>
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

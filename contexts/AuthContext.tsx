import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

  setAuthStep: (step: AuthStep) => void;
  setPhoneNumber: (phone: string) => Promise<void>;
  linkBank: (bankName: string, accountNumber: string) => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  enableBiometric: (enabled: boolean) => Promise<void>;
  linkAadhaar: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // NEW security model
  needsReauth: boolean;
  requireReauth: () => void;
  completeReauth: () => void;

  // OLD dashboard features (kept for compatibility)
  voiceGuideEnabled: boolean;
  toggleVoiceGuide: () => void;
  isOnline: boolean;
  setOnlineStatus: (v: boolean) => void;
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

  // security
  const [needsReauth, setNeedsReauth] = useState(false);

  // dashboard old features
  const [voiceGuideEnabled, setVoiceGuideEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // TEMPORARY: Reset onboarding to test Phone Verification
    // Remove this block after testing!
    const resetAndLoad = async () => {
      console.log("🔄 RESETTING ONBOARDING FOR TESTING...");
      await AsyncStorage.removeItem(AUTH_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      console.log("✅ Onboarding reset complete!");
      loadState();
    };
    resetAndLoad();
  }, []);

  const loadState = async () => {
    try {
      const savedAuth = await AsyncStorage.getItem(AUTH_KEY);
      const savedUser = await AsyncStorage.getItem(USER_KEY);
      const savedOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);

      if (savedOnboarding === "true") {
        setHasCompletedOnboarding(true);

        if (savedUser) setUserData(JSON.parse(savedUser));

        if (savedAuth === "authenticated") {
          setAuthStepState("authenticated");
          setNeedsReauth(true); // ask PIN because user already registered
        }
      }
    } catch (e) {
      console.log("AUTH LOAD ERROR:", e);
    }

    setIsLoading(false);
  };

  const setAuthStep = (step: AuthStep) => {
    setAuthStepState(step);
  };

  const setPhoneNumber = async (phone: string) => {
    const user: UserData = {
      phoneNumber: phone,
      bankName: "",
      bankAccountMasked: "",
      pin: "",
      biometricEnabled: false,
      aadhaarLinked: false,
    };
    setUserData(user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  };

  const linkBank = async (bankName: string, accountNumber: string) => {
    if (!userData) return;
    const masked = "XXXX XXXX XXXX " + accountNumber.slice(-4);

    const newUser = { ...userData, bankName, bankAccountMasked: masked };
    setUserData(newUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const setupPin = async (pin: string) => {
    if (!userData) return;
    const newUser = { ...userData, pin };
    setUserData(newUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const enableBiometric = async (enabled: boolean) => {
    if (!userData) return;
    const newUser = { ...userData, biometricEnabled: enabled };
    setUserData(newUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const linkAadhaar = async () => {
    if (!userData) return;
    const newUser = { ...userData, aadhaarLinked: true };
    setUserData(newUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const login = async () => {
    await AsyncStorage.setItem(AUTH_KEY, "authenticated");
    setAuthStepState("authenticated");
    setNeedsReauth(false);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setNeedsReauth(true);
    setAuthStepState("language_selection");
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setHasCompletedOnboarding(true);

    await AsyncStorage.setItem(AUTH_KEY, "authenticated");
    setAuthStepState("authenticated");
  };

  const requireReauth = () => {
    if (hasCompletedOnboarding) {
      console.log("🔐 requireReauth called - forcing stop on voice recorder");
      (global as any).stopVoiceRecording?.();
      setNeedsReauth(true);
    }
  };

  const completeReauth = () => {
    setNeedsReauth(false);
  };

  // dashboard toggles
  const toggleVoiceGuide = () =>
    setVoiceGuideEnabled((prev) => !prev);

  const setOnlineStatus = (v: boolean) => setIsOnline(v);

  return (
    <AuthContext.Provider
      value={{
        authStep,
        userData,
        isLoading,
        hasCompletedOnboarding,

        setAuthStep,
        setPhoneNumber,
        linkBank,
        setupPin,
        enableBiometric,
        linkAadhaar,
        login,
        logout,
        completeOnboarding,

        needsReauth,
        requireReauth,
        completeReauth,

        voiceGuideEnabled,
        toggleVoiceGuide,
        isOnline,
        setOnlineStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

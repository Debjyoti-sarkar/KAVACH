import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";

const PIN_LENGTH = 6;

type SetupStep = "biometric" | "pin_create" | "pin_confirm" | "aadhaar";

export default function SecuritySetupScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const { setupPin, enableBiometric, linkAadhaar, completeOnboarding } = useAuth();

  const [step, setStep] = useState<SetupStep>("biometric");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [biometricType, setBiometricType] = useState<string>("Biometric");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinError, setPinError] = useState(false);

  const shakeAnimation = useSharedValue(0);

  React.useEffect(() => {
    checkBiometricType();
  }, []);

  const checkBiometricType = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Fingerprint");
      }
    } catch (error) {
      console.log("Biometric check error:", error);
    }
  };

  const animatedShake = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const handleBiometricSetup = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setBiometricEnabled(false);
        setStep("pin_create");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType} for NEXAVAULT`,
        fallbackLabel: "Use PIN instead",
      });

      if (result.success) {
        setBiometricEnabled(true);
        await enableBiometric(true);
      }
      setStep("pin_create");
    } catch (error) {
      console.log("Biometric setup error:", error);
      setStep("pin_create");
    }
  };

  const handleSkipBiometric = () => {
    setBiometricEnabled(false);
    setStep("pin_create");
  };

  const handlePinChange = (value: string) => {
    if (value.length <= PIN_LENGTH) {
      setPin(value);
      setPinError(false);
      if (value.length === PIN_LENGTH) {
        setTimeout(() => setStep("pin_confirm"), 300);
      }
    }
  };

  const handleConfirmPinChange = (value: string) => {
    if (value.length <= PIN_LENGTH) {
      setConfirmPin(value);
      setPinError(false);
      if (value.length === PIN_LENGTH) {
        if (value === pin) {
          handlePinSetupComplete(value);
        } else {
          setPinError(true);
          shakeAnimation.value = withSequence(
            withSpring(-10, { damping: 3, stiffness: 400 }),
            withSpring(10, { damping: 3, stiffness: 400 }),
            withSpring(-10, { damping: 3, stiffness: 400 }),
            withSpring(0, { damping: 3, stiffness: 400 })
          );
          setConfirmPin("");
        }
      }
    }
  };

  const handlePinSetupComplete = async (finalPin: string) => {
    await setupPin(finalPin);
    setStep("aadhaar");
  };

  const handleAadhaarLink = async () => {
    await linkAadhaar();
    await completeOnboarding();
    navigation.reset({
      index: 0,
      routes: [{ name: "Dashboard" }],
    });
  };

  const handleSkipAadhaar = async () => {
    await completeOnboarding();
    navigation.reset({
      index: 0,
      routes: [{ name: "Dashboard" }],
    });
  };

  const renderBiometricStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.primary + "15" }]}>
        <Feather
          name={biometricType === "Face ID" ? "smile" : "lock"}
          size={48}
          color={NexaVaultColors.primary}
        />
      </View>
      <ThemedText type="h2" style={styles.title}>
        {t("setupBiometric")}
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Enable {biometricType} for quick and secure access to NEXAVAULT
      </ThemedText>

      <Button
        onPress={handleBiometricSetup}
        style={[styles.actionButton, { backgroundColor: NexaVaultColors.primary }]}
      >
        Enable {biometricType}
      </Button>

      <Pressable onPress={handleSkipBiometric} style={styles.skipButton}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Skip for now
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderPinStep = (isConfirm: boolean) => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.primary + "15" }]}>
        <Feather name="lock" size={48} color={NexaVaultColors.primary} />
      </View>
      <ThemedText type="h2" style={styles.title}>
        {isConfirm ? t("confirmPin") : t("createPin")}
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        {isConfirm
          ? "Enter the same PIN to confirm"
          : "Create a secure 6-digit PIN for backup access"}
      </ThemedText>

      <Animated.View style={[styles.pinContainer, animatedShake]}>
        <View style={styles.pinDots}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                {
                  backgroundColor:
                    (isConfirm ? confirmPin : pin).length > index
                      ? pinError
                        ? NexaVaultColors.sos
                        : NexaVaultColors.primary
                      : theme.border,
                },
              ]}
            />
          ))}
        </View>
        <TextInput
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={PIN_LENGTH}
          value={isConfirm ? confirmPin : pin}
          onChangeText={isConfirm ? handleConfirmPinChange : handlePinChange}
          autoFocus
          secureTextEntry
        />
      </Animated.View>

      {pinError ? (
        <ThemedText type="small" style={[styles.errorText, { color: NexaVaultColors.sos }]}>
          PINs do not match. Please try again.
        </ThemedText>
      ) : null}

      {isConfirm ? (
        <Pressable
          onPress={() => {
            setStep("pin_create");
            setPin("");
            setConfirmPin("");
          }}
          style={styles.skipButton}
        >
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Change PIN
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );

  const renderAadhaarStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.primary + "15" }]}>
        <Feather name="shield" size={48} color={NexaVaultColors.primary} />
      </View>
      <ThemedText type="h2" style={styles.title}>
        {t("aadhaarVerification")}
      </ThemedText>
      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        Link your Aadhaar for enhanced security and faster transactions
      </ThemedText>

      <View style={[styles.featuresList, { backgroundColor: theme.backgroundSecondary }]}>
        <FeatureItem icon="check-circle" text="Instant verification" theme={theme} />
        <FeatureItem icon="zap" text="Faster transactions" theme={theme} />
        <FeatureItem icon="shield" text="Enhanced security" theme={theme} />
      </View>

      <Button
        onPress={handleAadhaarLink}
        style={[styles.actionButton, { backgroundColor: NexaVaultColors.primary }]}
      >
        Link Aadhaar
      </Button>

      <Pressable onPress={handleSkipAadhaar} style={styles.skipButton}>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Skip for now
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.progressContainer}>
        {["biometric", "pin_create", "aadhaar"].map((s, index) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  step === s || (step === "pin_confirm" && s === "pin_create")
                    ? NexaVaultColors.primary
                    : (step === "pin_confirm" && index < 1) ||
                      (step === "aadhaar" && index < 2)
                    ? NexaVaultColors.primary
                    : theme.border,
              },
            ]}
          />
        ))}
      </View>

      {step === "biometric" && renderBiometricStep()}
      {step === "pin_create" && renderPinStep(false)}
      {step === "pin_confirm" && renderPinStep(true)}
      {step === "aadhaar" && renderAadhaarStep()}
    </ScreenKeyboardAwareScrollView>
  );
}

function FeatureItem({
  icon,
  text,
  theme,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  theme: any;
}) {
  return (
    <View style={styles.featureItem}>
      <Feather name={icon} size={20} color={NexaVaultColors.success} />
      <ThemedText type="small" style={{ marginLeft: Spacing.sm }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing["3xl"],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing["2xl"],
  },
  actionButton: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  skipButton: {
    padding: Spacing.md,
  },
  pinContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  pinDots: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: "100%",
    height: 60,
  },
  errorText: {
    marginBottom: Spacing.xl,
  },
  featuresList: {
    width: "100%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});

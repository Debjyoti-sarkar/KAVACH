import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
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

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function PhoneVerificationScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const { setPhoneNumber: savePhoneNumber, setAuthStep } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useSharedValue(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const animatedShake = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      shakeAnimation.value = withSequence(
        withSpring(-10, { damping: 3, stiffness: 400 }),
        withSpring(10, { damping: 3, stiffness: 400 }),
        withSpring(-10, { damping: 3, stiffness: 400 }),
        withSpring(0, { damping: 3, stiffness: 400 })
      );
      return;
    }
    setShowOtpInput(true);
    setResendTimer(RESEND_COOLDOWN);
    setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === OTP_LENGTH) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    await savePhoneNumber(phoneNumber);
    setAuthStep("bank_linking");
    navigation.navigate("BankLinking");
  };

  const handleResendOtp = () => {
    if (resendTimer === 0) {
      setResendTimer(RESEND_COOLDOWN);
      setOtp(new Array(OTP_LENGTH).fill(""));
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.primary + "15" }]}>
          <Feather name="smartphone" size={48} color={NexaVaultColors.primary} />
        </View>
        <ThemedText type="h2" style={styles.title}>
          {t("verifyNumber")}
        </ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {showOtpInput
            ? `${t("enterOtp")} +91 ${phoneNumber}`
            : "Enter your phone number to receive an OTP"}
        </ThemedText>
      </View>

      {!showOtpInput ? (
        <Animated.View style={[styles.phoneInputContainer, animatedShake]}>
          <View style={[styles.countryCode, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <ThemedText style={styles.countryCodeText}>+91</ThemedText>
          </View>
          <TextInput
            style={[
              styles.phoneInput,
              {
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder={t("phoneNumber")}
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            maxLength={10}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </Animated.View>
      ) : (
        <View style={styles.otpContainer}>
          <View style={styles.otpInputRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpInputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: digit ? NexaVaultColors.primary : theme.border,
                  },
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                editable={!isVerifying}
              />
            ))}
          </View>

          {isVerifying ? (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color={NexaVaultColors.primary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: theme.textSecondary }}>
                {t("verifying")}
              </ThemedText>
            </View>
          ) : (
            <Pressable
              onPress={handleResendOtp}
              disabled={resendTimer > 0}
              style={({ pressed }) => [
                styles.resendButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: resendTimer > 0 ? theme.textSecondary : NexaVaultColors.primary,
                }}
              >
                {resendTimer > 0
                  ? `${t("resendOtp")} (${resendTimer}s)`
                  : t("resendOtp")}
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}

      {!showOtpInput ? (
        <Button
          onPress={handleSendOtp}
          style={[styles.sendButton, { backgroundColor: NexaVaultColors.primary }]}
        >
          {t("sendOtp")}
        </Button>
      ) : null}
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
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
  },
  phoneInputContainer: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  countryCode: {
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 18,
    letterSpacing: 1,
    ...Shadows.sm,
  },
  otpContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  otpInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    ...Shadows.sm,
  },
  verifyingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendButton: {
    padding: Spacing.sm,
  },
  sendButton: {
    marginTop: Spacing.lg,
  },
});

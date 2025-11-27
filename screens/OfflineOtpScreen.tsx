import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";

const OTP_VALIDITY_SECONDS = 30;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function OfflineOtpScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [otp, setOtp] = useState(generateOTP());
  const [timeLeft, setTimeLeft] = useState(OTP_VALIDITY_SECONDS);
  const [isGenerating, setIsGenerating] = useState(false);

  const progressValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = 1;
    progressValue.value = withTiming(0, { duration: OTP_VALIDITY_SECONDS * 1000, easing: Easing.linear });

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          regenerateOtp();
          return OTP_VALIDITY_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otp]);

  const regenerateOtp = () => {
    setIsGenerating(true);
    rotateValue.value = withRepeat(
      withTiming(1, { duration: 500, easing: Easing.linear }),
      2,
      false
    );
    
    setTimeout(() => {
      setOtp(generateOTP());
      setTimeLeft(OTP_VALIDITY_SECONDS);
      setIsGenerating(false);
      progressValue.value = 1;
      progressValue.value = withTiming(0, { duration: OTP_VALIDITY_SECONDS * 1000, easing: Easing.linear });
    }, 500);
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value * 360}deg` }],
  }));

  const getTimeColor = () => {
    if (timeLeft <= 10) return NexaVaultColors.sos;
    if (timeLeft <= 20) return NexaVaultColors.warning;
    return NexaVaultColors.success;
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.warning + "15" }]}>
          <Feather name="lock" size={48} color={NexaVaultColors.warning} />
        </View>
        <ThemedText type="h3" style={styles.title}>
          {t("offlineOtp")}
        </ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Generate secure OTP even without internet connection
        </ThemedText>
      </View>

      <View style={[styles.otpCard, { backgroundColor: theme.card }, Shadows.lg]}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
          Your Current OTP
        </ThemedText>
        
        <View style={styles.otpDisplay}>
          {otp.split("").map((digit, index) => (
            <View
              key={index}
              style={[styles.otpDigit, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText style={styles.otpDigitText}>{digit}</ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.timerContainer}>
          <View style={[styles.timerBar, { backgroundColor: theme.backgroundSecondary }]}>
            <Animated.View
              style={[
                styles.timerProgress,
                { backgroundColor: getTimeColor() },
                progressStyle,
              ]}
            />
          </View>
          <View style={styles.timerInfo}>
            <Feather name="clock" size={16} color={getTimeColor()} />
            <ThemedText type="small" style={{ color: getTimeColor(), marginLeft: Spacing.xs }}>
              {timeLeft}s remaining
            </ThemedText>
          </View>
        </View>

        <Pressable
          onPress={regenerateOtp}
          disabled={isGenerating}
          style={[styles.refreshButton, { borderColor: NexaVaultColors.primary }]}
        >
          <Animated.View style={rotateStyle}>
            <Feather name="refresh-cw" size={20} color={NexaVaultColors.primary} />
          </Animated.View>
          <ThemedText style={{ color: NexaVaultColors.primary, marginLeft: Spacing.sm }}>
            Generate New OTP
          </ThemedText>
        </Pressable>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText type="small" style={{ fontWeight: "600", marginBottom: Spacing.md }}>
          How to use Offline OTP:
        </ThemedText>
        <View style={styles.stepItem}>
          <View style={[styles.stepNumber, { backgroundColor: NexaVaultColors.primary }]}>
            <ThemedText style={styles.stepNumberText}>1</ThemedText>
          </View>
          <ThemedText type="small" style={styles.stepText}>
            Open this screen when you need to authenticate a transaction
          </ThemedText>
        </View>
        <View style={styles.stepItem}>
          <View style={[styles.stepNumber, { backgroundColor: NexaVaultColors.primary }]}>
            <ThemedText style={styles.stepNumberText}>2</ThemedText>
          </View>
          <ThemedText type="small" style={styles.stepText}>
            Share the 6-digit code with the bank or merchant
          </ThemedText>
        </View>
        <View style={styles.stepItem}>
          <View style={[styles.stepNumber, { backgroundColor: NexaVaultColors.primary }]}>
            <ThemedText style={styles.stepNumberText}>3</ThemedText>
          </View>
          <ThemedText type="small" style={styles.stepText}>
            OTP is valid for 30 seconds and auto-refreshes
          </ThemedText>
        </View>
      </View>

      <View style={[styles.warningCard, { backgroundColor: NexaVaultColors.warning + "15" }]}>
        <Feather name="alert-triangle" size={20} color={NexaVaultColors.warning} />
        <ThemedText type="small" style={{ color: NexaVaultColors.warning, marginLeft: Spacing.sm, flex: 1 }}>
          Never share your OTP with anyone claiming to be from bank support.
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
  otpCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  otpDisplay: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpDigit: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  otpDigitText: {
    fontSize: 28,
    fontWeight: "700",
  },
  timerContainer: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  timerBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  timerProgress: {
    height: "100%",
    borderRadius: 3,
  },
  timerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
});

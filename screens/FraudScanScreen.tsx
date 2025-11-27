import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";

type ScanResult = "safe" | "suspicious" | "dangerous" | null;

const FRAUD_INDICATORS = [
  "urgent action required",
  "click here immediately",
  "verify your account",
  "suspended account",
  "lottery winner",
  "bank otp",
  "share otp",
  "kyc update",
  "free gift",
  "claim prize",
];

export default function FraudScanScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [message, setMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [detectedIndicators, setDetectedIndicators] = useState<string[]>([]);

  const scanProgress = useSharedValue(0);
  const resultScale = useSharedValue(0);

  const scanAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanProgress.value * 360}deg` }],
  }));

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultScale.value }],
    opacity: resultScale.value,
  }));

  const analyzeMessage = (text: string): { result: ScanResult; indicators: string[] } => {
    const lowerText = text.toLowerCase();
    const found = FRAUD_INDICATORS.filter((indicator) => lowerText.includes(indicator));

    if (found.length >= 3) {
      return { result: "dangerous", indicators: found };
    } else if (found.length >= 1) {
      return { result: "suspicious", indicators: found };
    }
    return { result: "safe", indicators: [] };
  };

  const handleScan = async () => {
    if (!message.trim()) return;

    setIsScanning(true);
    setResult(null);
    resultScale.value = 0;

    scanProgress.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      3,
      false
    );

    await new Promise((resolve) => setTimeout(resolve, 2500));

    const analysis = analyzeMessage(message);
    setResult(analysis.result);
    setDetectedIndicators(analysis.indicators);
    setIsScanning(false);

    resultScale.value = withSpring(1, { damping: 12, stiffness: 150 });
  };

  const handleClear = () => {
    setMessage("");
    setResult(null);
    setDetectedIndicators([]);
    resultScale.value = 0;
  };

  const getResultColor = () => {
    switch (result) {
      case "safe":
        return NexaVaultColors.success;
      case "suspicious":
        return NexaVaultColors.warning;
      case "dangerous":
        return NexaVaultColors.sos;
      default:
        return theme.textSecondary;
    }
  };

  const getResultIcon = (): keyof typeof Feather.glyphMap => {
    switch (result) {
      case "safe":
        return "check-circle";
      case "suspicious":
        return "alert-triangle";
      case "dangerous":
        return "alert-octagon";
      default:
        return "help-circle";
    }
  };

  const getResultMessage = () => {
    switch (result) {
      case "safe":
        return "This message appears to be safe. No fraud indicators detected.";
      case "suspicious":
        return "This message contains suspicious content. Be cautious before responding.";
      case "dangerous":
        return "Warning! This message shows multiple fraud indicators. Do not respond or click any links.";
      default:
        return "";
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.success + "15" }]}>
          <Feather name="shield" size={48} color={NexaVaultColors.success} />
        </View>
        <ThemedText type="h3" style={styles.title}>
          {t("scanForFraud")}
        </ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
          Paste any suspicious message to check for potential fraud
        </ThemedText>
      </View>

      <View style={styles.inputSection}>
        <ThemedText type="small" style={[styles.label, { color: theme.textSecondary }]}>
          Message to analyze
        </ThemedText>
        <TextInput
          style={[
            styles.messageInput,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="Paste the message here..."
          placeholderTextColor={theme.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.buttonRow}>
        <Button
          onPress={handleScan}
          disabled={!message.trim() || isScanning}
          style={{ backgroundColor: NexaVaultColors.primary, flex: 1 }}
        >
          {isScanning ? "Scanning..." : "Scan for Fraud"}
        </Button>
        {message ? (
          <Pressable
            onPress={handleClear}
            style={[styles.clearButton, { borderColor: theme.border }]}
          >
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {isScanning ? (
        <View style={styles.scanningContainer}>
          <Animated.View style={scanAnimatedStyle}>
            <Feather name="loader" size={48} color={NexaVaultColors.primary} />
          </Animated.View>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
            Analyzing message patterns...
          </ThemedText>
        </View>
      ) : null}

      {result ? (
        <Animated.View style={[styles.resultContainer, resultAnimatedStyle]}>
          <View
            style={[
              styles.resultCard,
              { backgroundColor: getResultColor() + "15", borderColor: getResultColor() },
            ]}
          >
            <View style={[styles.resultIconCircle, { backgroundColor: getResultColor() }]}>
              <Feather name={getResultIcon()} size={32} color="#FFFFFF" />
            </View>
            <ThemedText type="h4" style={{ color: getResultColor(), marginBottom: Spacing.sm }}>
              {result === "safe" ? "Safe" : result === "suspicious" ? "Suspicious" : "Dangerous"}
            </ThemedText>
            <ThemedText type="small" style={[styles.resultMessage, { color: theme.text }]}>
              {getResultMessage()}
            </ThemedText>

            {detectedIndicators.length > 0 ? (
              <View style={styles.indicatorsContainer}>
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
                  Detected indicators:
                </ThemedText>
                {detectedIndicators.map((indicator, index) => (
                  <View key={index} style={styles.indicatorTag}>
                    <Feather name="alert-circle" size={12} color={getResultColor()} />
                    <ThemedText type="caption" style={{ color: getResultColor(), marginLeft: Spacing.xs }}>
                      {indicator}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      <View style={[styles.tipsCard, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText type="small" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
          Tips to stay safe:
        </ThemedText>
        <View style={styles.tipItem}>
          <Feather name="check" size={16} color={NexaVaultColors.success} />
          <ThemedText type="caption" style={{ marginLeft: Spacing.sm, flex: 1 }}>
            Never share OTP or PIN with anyone
          </ThemedText>
        </View>
        <View style={styles.tipItem}>
          <Feather name="check" size={16} color={NexaVaultColors.success} />
          <ThemedText type="caption" style={{ marginLeft: Spacing.sm, flex: 1 }}>
            Banks never ask for personal details via SMS
          </ThemedText>
        </View>
        <View style={styles.tipItem}>
          <Feather name="check" size={16} color={NexaVaultColors.success} />
          <ThemedText type="caption" style={{ marginLeft: Spacing.sm, flex: 1 }}>
            Verify sender before clicking any links
          </ThemedText>
        </View>
      </View>
    </ScreenKeyboardAwareScrollView>
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
  inputSection: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageInput: {
    minHeight: 150,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  clearButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanningContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  resultContainer: {
    marginBottom: Spacing.xl,
  },
  resultCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  resultIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  resultMessage: {
    textAlign: "center",
  },
  indicatorsContainer: {
    marginTop: Spacing.lg,
    width: "100%",
  },
  indicatorTag: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  tipsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
});

import React, { useState } from "react";
import { View, StyleSheet, Alert, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";

const USER_KEY = "@nexavault_user";

export default function AadhaarVerificationScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { userData } = useAuth();

  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"input" | "otp" | "verified">(
    userData?.aadhaarLinked ? "verified" : "input"
  );
  const [isLoading, setIsLoading] = useState(false);

  const formatAadhaar = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(" ");
  };

  const handleSendOtp = async () => {
    const digits = aadhaarNumber.replace(/\D/g, "");
    
    if (digits.length !== 12) {
      Alert.alert("Invalid Aadhaar", "Please enter a valid 12-digit Aadhaar number");
      return;
    }

    setIsLoading(true);
    
    // Simulate OTP sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setStep("otp");
    Alert.alert("OTP Sent", "A verification code has been sent to your registered mobile number");
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);

    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo, accept any 6-digit OTP
    try {
      const updatedUser = { ...userData, aadhaarLinked: true };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      
      setIsLoading(false);
      setStep("verified");
      Alert.alert("Success", "Your Aadhaar has been verified successfully!");
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Error", "Verification failed. Please try again.");
    }
  };

  const handleUnlink = () => {
    Alert.alert(
      "Unlink Aadhaar",
      "Are you sure you want to unlink your Aadhaar? Some features may become unavailable.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: async () => {
            const updatedUser = { ...userData, aadhaarLinked: false };
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
            setStep("input");
            setAadhaarNumber("");
            setOtp("");
          }
        }
      ]
    );
  };

  if (step === "verified") {
    return (
      <ScreenScrollView>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.success + "15" }]}>
            <Feather name="check-circle" size={32} color={NexaVaultColors.success} />
          </View>
          <ThemedText type="h3" style={styles.title}>Aadhaar Verified</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your Aadhaar is linked to your account
          </ThemedText>
        </View>

        <View style={[styles.verifiedCard, { backgroundColor: theme.card }, Shadows.sm]}>
          <View style={styles.verifiedRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Aadhaar Number</ThemedText>
            <ThemedText style={styles.maskedNumber}>XXXX XXXX XXXX</ThemedText>
          </View>
          <View style={styles.verifiedRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Status</ThemedText>
            <View style={styles.statusBadge}>
              <Feather name="check" size={14} color={NexaVaultColors.success} />
              <ThemedText style={{ color: NexaVaultColors.success }}>Verified</ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: NexaVaultColors.info + "10" }]}>
          <Feather name="shield" size={20} color={NexaVaultColors.info} />
          <View style={styles.benefitsText}>
            <ThemedText style={{ fontWeight: "500" }}>Enhanced Security</ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Your account is protected with Aadhaar-based verification
            </ThemedText>
          </View>
        </View>

        <Button
          onPress={handleUnlink}
          variant="outline"
          style={styles.unlinkButton}
        >
          Unlink Aadhaar
        </Button>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.primary + "15" }]}>
          <Feather name="shield" size={32} color={NexaVaultColors.primary} />
        </View>
        <ThemedText type="h3" style={styles.title}>Aadhaar Verification</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Link your Aadhaar for enhanced security and higher transaction limits
        </ThemedText>
      </View>

      {step === "input" ? (
        <>
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Aadhaar Number
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={formatAadhaar(aadhaarNumber)}
              onChangeText={(text) => setAadhaarNumber(text.replace(/\D/g, ""))}
              placeholder="XXXX XXXX XXXX"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>

          <View style={[styles.infoCard, { backgroundColor: NexaVaultColors.warning + "10" }]}>
            <Feather name="info" size={20} color={NexaVaultColors.warning} />
            <ThemedText style={[styles.infoText, { color: theme.text }]}>
              An OTP will be sent to your Aadhaar-registered mobile number for verification.
            </ThemedText>
          </View>

          <Button
            onPress={handleSendOtp}
            disabled={isLoading || aadhaarNumber.replace(/\D/g, "").length !== 12}
          >
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Enter OTP
            </ThemedText>
            <TextInput
              style={[styles.input, styles.otpInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              value={otp}
              onChangeText={(text) => setOtp(text.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <Pressable onPress={() => setStep("input")} style={styles.resendLink}>
            <ThemedText style={{ color: NexaVaultColors.primary }}>
              Didn't receive OTP? Resend
            </ThemedText>
          </Pressable>

          <Button
            onPress={handleVerifyOtp}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>
        </>
      )}

      <View style={styles.benefits}>
        <ThemedText type="h4" style={styles.benefitsTitle}>Why link Aadhaar?</ThemedText>
        
        <View style={styles.benefitItem}>
          <Feather name="trending-up" size={20} color={NexaVaultColors.primary} />
          <ThemedText style={{ flex: 1 }}>Higher transaction limits</ThemedText>
        </View>

        <View style={styles.benefitItem}>
          <Feather name="shield" size={20} color={NexaVaultColors.primary} />
          <ThemedText style={{ flex: 1 }}>Enhanced account security</ThemedText>
        </View>

        <View style={styles.benefitItem}>
          <Feather name="check-circle" size={20} color={NexaVaultColors.primary} />
          <ThemedText style={{ flex: 1 }}>Quick KYC verification</ThemedText>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 18,
    letterSpacing: 2,
  },
  otpInput: {
    textAlign: "center",
    letterSpacing: 8,
  },
  infoCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  resendLink: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  benefits: {
    marginTop: Spacing["2xl"],
    gap: Spacing.md,
  },
  benefitsTitle: {
    marginBottom: Spacing.sm,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  verifiedCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  verifiedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  maskedNumber: {
    fontSize: 16,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  benefitsCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  benefitsText: {
    flex: 1,
  },
  unlinkButton: {
    marginTop: Spacing.md,
  },
});

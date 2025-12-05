import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { sendOTP, verifyOTP } from "@/utils/otpManager";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";

export default function PhoneVerificationScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const { setPhoneNumber, setAuthStep } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [demoOTP, setDemoOTP] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(phone);

      if (result.success && result.otp) {
        setStep("otp");
        setResendTimer(60);
        setDemoOTP(result.otp);
        
        Alert.alert(
          "🎯 OTP Generated",
          `Your verification code is:\n\n${result.otp}\n\n(No SMS sent)`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to generate OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(phone, otp);

      if (result.success) {
        await setPhoneNumber(phone);
        setAuthStep("bank_linking");
        navigation.navigate("BankLinking");
      } else {
        Alert.alert("Verification Failed", result.error || "Invalid OTP");
        setOtp("");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setOtp("");
    setDemoOTP(null);
    handleSendOtp();
  };

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtp("");
      setDemoOTP(null);
      setResendTimer(0);
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScreenKeyboardAwareScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
      </View>

      <View style={[styles.iconContainer, { backgroundColor: NexaVaultColors.primary + "15" }]}>
        <Feather name="smartphone" size={48} color={NexaVaultColors.primary} />
      </View>

      <ThemedText type="h2" style={styles.title}>
        {step === "phone" ? "Phone Verification" : "Enter Code"}
      </ThemedText>

      <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
        {step === "phone"
          ? "We'll generate a 6-digit verification code"
          : `Enter the code for +91${phone}`}
      </ThemedText>

      <View style={[styles.demoBanner, { backgroundColor: NexaVaultColors.warning + "20" }]}>
        <Feather name="info" size={16} color={NexaVaultColors.warning} />
        <ThemedText type="caption" style={{ color: NexaVaultColors.warning, marginLeft: 8 }}>
          OTP shown on screen
        </ThemedText>
      </View>

      {step === "phone" ? (
        <View style={styles.inputSection}>
          <View style={styles.phoneInputContainer}>
            <View style={[styles.countryCode, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.countryCodeText}>🇮🇳 +91</ThemedText>
            </View>
            <TextInput
              style={[styles.phoneInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="10-digit mobile number"
              placeholderTextColor={theme.textSecondary}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          <Button onPress={handleSendOtp} disabled={phone.length !== 10 || loading} style={[styles.button, { backgroundColor: NexaVaultColors.primary }]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : "Generate OTP"}
          </Button>
        </View>
      ) : (
        <View style={styles.inputSection}>
          {demoOTP && (
            <View style={[styles.demoOtpBox, { backgroundColor: NexaVaultColors.success + "15" }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>Your OTP:</ThemedText>
              <ThemedText type="h1" style={{ color: NexaVaultColors.success, letterSpacing: 8 }}>{demoOTP}</ThemedText>
            </View>
          )}

          <View style={styles.otpContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <View key={index} style={[styles.otpBox, { backgroundColor: theme.card, borderColor: otp.length === index ? NexaVaultColors.primary : theme.border, borderWidth: otp.length === index ? 2 : 1 }]}>
                <ThemedText type="h3">{otp[index] || ""}</ThemedText>
              </View>
            ))}
          </View>

          <TextInput style={styles.hiddenInput} value={otp} onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={6} autoFocus />

          <Button onPress={handleVerifyOtp} disabled={otp.length !== 6 || loading} style={[styles.button, { backgroundColor: NexaVaultColors.primary }]}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : "Verify OTP"}
          </Button>

          <View style={styles.resendContainer}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Didn't see code?</ThemedText>
            <Pressable onPress={handleResendOtp} disabled={resendTimer > 0}>
              <ThemedText type="small" style={{ color: resendTimer > 0 ? theme.textSecondary : NexaVaultColors.primary, fontWeight: "600", padding: 8 }}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Generate New"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  header: { marginBottom: Spacing.xl },
  backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  iconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: Spacing.xl },
  title: { textAlign: "center", marginBottom: Spacing.sm },
  subtitle: { textAlign: "center", marginBottom: Spacing.xl },
  demoBanner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, borderRadius: BorderRadius.sm, marginBottom: Spacing.lg },
  inputSection: { flex: 1 },
  phoneInputContainer: { flexDirection: "row", marginBottom: Spacing.xl, gap: Spacing.sm },
  countryCode: { paddingHorizontal: Spacing.lg, justifyContent: "center", borderRadius: BorderRadius.sm },
  countryCodeText: { fontSize: 16, fontWeight: "600" },
  phoneInput: { flex: 1, height: 56, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, borderWidth: 1, fontSize: 16 },
  button: { marginBottom: Spacing.lg },
  demoOtpBox: { padding: Spacing.xl, borderRadius: BorderRadius.md, alignItems: "center", marginBottom: Spacing.xl, ...Shadows.md },
  otpContainer: { flexDirection: "row", justifyContent: "center", gap: Spacing.sm, marginBottom: Spacing.xl },
  otpBox: { width: 50, height: 60, alignItems: "center", justifyContent: "center", borderRadius: BorderRadius.sm, ...Shadows.sm },
  hiddenInput: { position: "absolute", opacity: 0 },
  resendContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, marginTop: Spacing.md },
});
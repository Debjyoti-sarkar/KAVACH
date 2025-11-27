import React, { useState } from "react";
import { View, StyleSheet, Pressable, Switch, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MENU_ITEM_SIZE = 70;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MenuItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  size?: number;
}

function MenuItem({ icon, label, color, onPress, size = MENU_ITEM_SIZE }: MenuItemProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.92, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      style={[styles.menuItem, animatedStyle]}
    >
      <View
        style={[
          styles.menuIconContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          Shadows.md,
        ]}
      >
        <Feather name={icon} size={size * 0.4} color="#FFFFFF" />
      </View>
      <ThemedText type="caption" style={[styles.menuLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

function VoiceAssistantButton({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      style={[
        styles.voiceAssistantButton,
        { backgroundColor: NexaVaultColors.voiceAssistant },
        Shadows.lg,
        animatedStyle,
      ]}
    >
      <Feather name="mic" size={32} color="#FFFFFF" />
      <ThemedText style={styles.voiceLabel}>{t("voiceAssistant").toUpperCase()}</ThemedText>
    </AnimatedPressable>
  );
}

function SOSButton({ onPress }: { onPress: () => void }) {
  const { t } = useLanguage();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }}
      style={[
        styles.sosButton,
        { backgroundColor: NexaVaultColors.sos },
        Shadows.md,
        animatedStyle,
      ]}
    >
      <Feather name="alert-triangle" size={16} color="#FFFFFF" />
      <ThemedText style={styles.sosText}>SOS</ThemedText>
    </AnimatedPressable>
  );
}

function FraudStatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  color: string;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.fraudStatCard, { backgroundColor: theme.card }]}>
      <View style={[styles.fraudStatIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
        {label}
      </ThemedText>
      <View style={[styles.fraudStatDot, { backgroundColor: value > 0 ? NexaVaultColors.success : theme.border }]} />
    </View>
  );
}

export default function DashboardScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const { voiceGuideEnabled, toggleVoiceGuide, isOnline, setOnlineStatus } = useAuth();

  const accountBalance = 5250.75;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.topBar}>
        <SOSButton onPress={() => navigation.navigate("SOS")} />

        <View style={styles.topBarRight}>
          <View style={styles.voiceGuideToggle}>
            <Feather
              name="volume-2"
              size={16}
              color={voiceGuideEnabled ? NexaVaultColors.primary : theme.textSecondary}
            />
            <ThemedText type="caption" style={{ marginLeft: Spacing.xs, color: theme.textSecondary }}>
              {voiceGuideEnabled ? "ON" : "OFF"}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Settings")}
            style={[styles.settingsButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="settings" size={18} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.languageSection}>
        <ThemedText type="caption" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t("languageSelection")}
        </ThemedText>
        <View style={styles.languageButtons}>
          <View style={[styles.langButton, { backgroundColor: NexaVaultColors.warning }]}>
            <ThemedText style={styles.langButtonText}>ଓଡ଼ିଆ</ThemedText>
          </View>
          <View style={[styles.langButton, { backgroundColor: NexaVaultColors.primary }]}>
            <ThemedText style={styles.langButtonText}>English</ThemedText>
          </View>
        </View>
        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
          {t("appWillSpeak")}
        </ThemedText>
      </View>

      <View style={styles.dashboardHeader}>
        <View style={styles.voiceGuideIndicator}>
          <Feather name="play-circle" size={16} color={theme.textSecondary} />
          <ThemedText type="caption" style={{ marginLeft: Spacing.xs, color: theme.textSecondary }}>
            {t("voiceGuide")}: {voiceGuideEnabled ? "ON" : "OFF"}
          </ThemedText>
        </View>
        <ThemedText type="h4">{t("homeDashboard")}</ThemedText>
      </View>

      <View style={styles.menuContainer}>
        <View style={styles.menuRow}>
          <MenuItem
            icon="search"
            label={t("scanForFraud")}
            color={NexaVaultColors.success}
            onPress={() => navigation.navigate("FraudScan")}
          />
          <MenuItem
            icon="send"
            label={t("sendMoney")}
            color={NexaVaultColors.primary}
            onPress={() => navigation.navigate("SendMoney")}
          />
          <View style={styles.balanceContainer}>
            <MenuItem
              icon="credit-card"
              label=""
              color={NexaVaultColors.info}
              onPress={() => navigation.navigate("Balance")}
              size={60}
            />
          </View>
        </View>

        <View style={styles.centerSection}>
          <View style={styles.balanceDisplay}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {t("accountBalance").toUpperCase()}:
            </ThemedText>
            <ThemedText type="h2" style={styles.balanceAmount}>
              ₹ {accountBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.menuRow}>
          <MenuItem
            icon="lock"
            label={t("offlineOtp")}
            color={NexaVaultColors.warning}
            onPress={() => navigation.navigate("OfflineOtp")}
          />
          <VoiceAssistantButton onPress={() => navigation.navigate("VoiceAssistant")} />
          <MenuItem
            icon="clock"
            label={t("recentActivity")}
            color={NexaVaultColors.recentActivity}
            onPress={() => navigation.navigate("TransactionHistory")}
          />
        </View>
      </View>

      <View style={styles.fraudDashboard}>
        <ThemedText type="caption" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t("miniFraudDashboard")}
        </ThemedText>
        <View style={styles.fraudStats}>
          <FraudStatCard icon="message-square" label={t("sms")} value={1} color={NexaVaultColors.info} />
          <FraudStatCard icon="smartphone" label={t("device")} value={1} color={NexaVaultColors.success} />
          <FraudStatCard icon="repeat" label={t("transactions")} value={0} color={NexaVaultColors.warning} />
          <FraudStatCard icon="shield" label={t("service")} value={1} color={NexaVaultColors.primary} />
        </View>
      </View>

      <View style={styles.networkStatus}>
        <ThemedText type="caption" style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          {t("networkStatus")}
        </ThemedText>
        <View style={styles.networkToggle}>
          <Feather
            name={isOnline ? "wifi" : "wifi-off"}
            size={18}
            color={isOnline ? NexaVaultColors.success : theme.textSecondary}
          />
          <ThemedText
            type="small"
            style={[
              styles.networkLabel,
              { color: isOnline ? NexaVaultColors.primary : theme.textSecondary },
            ]}
          >
            {t("online")}
          </ThemedText>
          <Switch
            value={isOnline}
            onValueChange={setOnlineStatus}
            trackColor={{ false: theme.border, true: NexaVaultColors.primary + "60" }}
            thumbColor={isOnline ? NexaVaultColors.primary : theme.backgroundSecondary}
          />
          <ThemedText
            type="small"
            style={[
              styles.networkLabel,
              { color: !isOnline ? NexaVaultColors.warning : theme.textSecondary },
            ]}
          >
            {t("offline")}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  sosText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  voiceGuideToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  languageSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  languageButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  langButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  langButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  dashboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  voiceGuideIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
  },
  menuItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  menuIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 10,
    textAlign: "center",
    maxWidth: 80,
  },
  balanceContainer: {
    alignItems: "center",
  },
  centerSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  balanceDisplay: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  balanceAmount: {
    letterSpacing: 1,
  },
  voiceAssistantButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceLabel: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "600",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  fraudDashboard: {
    marginBottom: Spacing.xl,
  },
  fraudStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  fraudStatCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    ...Shadows.sm,
  },
  fraudStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fraudStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkStatus: {
    alignItems: "center",
  },
  networkToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  networkLabel: {
    fontWeight: "500",
  },
});

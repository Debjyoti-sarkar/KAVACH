import React from "react";
import { View, StyleSheet, Pressable, Switch, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, rightElement, danger }: SettingsItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.settingsItem, { backgroundColor: theme.card }]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: (danger ? NexaVaultColors.sos : NexaVaultColors.primary) + "15" }]}>
        <Feather name={icon} size={20} color={danger ? NexaVaultColors.sos : NexaVaultColors.primary} />
      </View>
      <View style={styles.settingsInfo}>
        <ThemedText style={[styles.settingsTitle, danger && { color: NexaVaultColors.sos }]}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {rightElement ? rightElement : onPress ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, language, languages, setLanguage } = useLanguage();
  const { voiceGuideEnabled, toggleVoiceGuide, userData, logout } = useAuth();

  const currentLanguage = languages.find((l) => l.code === language);

  const handleLogout = () => {
    Alert.alert(
      t("logout"),
      "Are you sure you want to logout?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      t("selectLanguage"),
      "Choose your preferred language",
      languages.map((lang) => ({
        text: lang.nativeName,
        onPress: () => setLanguage(lang.code),
      }))
    );
  };

  return (
    <ScreenScrollView>
      <View style={[styles.profileCard, { backgroundColor: theme.card }, Shadows.md]}>
        <View style={[styles.avatar, { backgroundColor: NexaVaultColors.primary }]}>
          <ThemedText style={styles.avatarText}>U</ThemedText>
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="h4">User</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {userData?.phoneNumber ? `+91 ${userData.phoneNumber}` : "+91 XXXXXXXXXX"}
          </ThemedText>
        </View>
        <Pressable style={[styles.editButton, { borderColor: theme.border }]}>
          <Feather name="edit-2" size={16} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          PREFERENCES
        </ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="globe"
            title="Language"
            subtitle={currentLanguage?.nativeName}
            onPress={handleLanguageChange}
          />
          <SettingsItem
            icon="volume-2"
            title={t("voiceGuide")}
            subtitle="Audio guidance for navigation"
            rightElement={
              <Switch
                value={voiceGuideEnabled}
                onValueChange={toggleVoiceGuide}
                trackColor={{ false: theme.border, true: NexaVaultColors.primary + "60" }}
                thumbColor={voiceGuideEnabled ? NexaVaultColors.primary : theme.backgroundSecondary}
              />
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          SECURITY
        </ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="lock"
            title="Change PIN"
            subtitle="Update your 6-digit PIN"
            onPress={() => {}}
          />
          <SettingsItem
            icon="smartphone"
            title="Biometric Authentication"
            subtitle={userData?.biometricEnabled ? "Enabled" : "Disabled"}
            onPress={() => {}}
          />
          <SettingsItem
            icon="credit-card"
            title="Linked Accounts"
            subtitle={userData?.bankName || "Manage your bank accounts"}
            onPress={() => navigation.navigate("Balance")}
          />
          <SettingsItem
            icon="shield"
            title="Aadhaar Verification"
            subtitle={userData?.aadhaarLinked ? "Verified" : "Not linked"}
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="caption" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          SUPPORT
        </ThemedText>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="help-circle"
            title="Help & FAQ"
            onPress={() => {}}
          />
          <SettingsItem
            icon="message-circle"
            title="Contact Support"
            onPress={() => {}}
          />
          <SettingsItem
            icon="file-text"
            title="Terms & Privacy"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingsGroup}>
          <SettingsItem
            icon="log-out"
            title={t("logout")}
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>
          NEXAVAULT v1.0.0
        </ThemedText>
        <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.xs }}>
          Security in your hands
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  profileInfo: {
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    letterSpacing: 0.5,
  },
  settingsGroup: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    gap: 1,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
});

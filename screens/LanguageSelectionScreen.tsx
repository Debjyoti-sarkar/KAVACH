import React, { useState } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { Language } from "@/constants/i18n";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface LanguageCardProps {
  code: Language;
  name: string;
  nativeName: string;
  isSelected: boolean;
  onSelect: () => void;
}

function LanguageCard({ code, name, nativeName, isSelected, onSelect }: LanguageCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.languageCard,
        {
          backgroundColor: theme.card,
          borderColor: isSelected ? NexaVaultColors.primary : theme.border,
          borderWidth: isSelected ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.languageTextContainer}>
        <ThemedText style={styles.languageNativeName}>{nativeName}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {name}
        </ThemedText>
      </View>
      {isSelected ? (
        <View style={[styles.checkIcon, { backgroundColor: NexaVaultColors.primary }]}>
          <Feather name="check" size={16} color="#FFFFFF" />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

export default function LanguageSelectionScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { language, setLanguage, languages, t } = useLanguage();
  const { setAuthStep } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  const handleContinue = async () => {
    await setLanguage(selectedLanguage);
    setAuthStep("phone_verification");
    navigation.navigate("PhoneVerification");
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText
          style={[styles.appName, { color: isDark ? theme.text : NexaVaultColors.primary }]}
        >
          NEXAVAULT
        </ThemedText>
        <ThemedText style={[styles.tagline, { color: theme.textSecondary }]}>
          {t("taglineNative")}
        </ThemedText>
        <ThemedText style={[styles.taglineSmall, { color: theme.textSecondary }]}>
          {t("tagline")}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          {t("languageSelection")}
        </ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t("appWillSpeak")}
        </ThemedText>

        <View style={styles.languagesGrid}>
          {languages.map((lang) => (
            <LanguageCard
              key={lang.code}
              code={lang.code}
              name={lang.name}
              nativeName={lang.nativeName}
              isSelected={selectedLanguage === lang.code}
              onSelect={() => setSelectedLanguage(lang.code)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button onPress={handleContinue} style={styles.continueButton}>
          {t("continue")}
        </Button>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
    paddingTop: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  appName: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  taglineSmall: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  languagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  languageCard: {
    width: "48%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.md,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageNativeName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingTop: Spacing.xl,
  },
  continueButton: {
    backgroundColor: NexaVaultColors.primary,
  },
});

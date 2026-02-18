import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Pressable, Switch, Dimensions, ScrollView, GestureResponderEvent, NativeSyntheticEvent, NativeScrollEvent, Image, ImageBackground, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTTS } from "@/hooks/useTTS";
import { LinearGradient } from "expo-linear-gradient";

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
import { useWakeWord } from "@/hooks/useWakeWord";
import { useNexaSafe } from "@/contexts/NexaSafeContext";
import { Spacing, BorderRadius, KAVACHColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Responsive tile image size for different breakpoints (web + native)
const TILE_IMAGE_SIZE = SCREEN_WIDTH < 600 ? 56 : SCREEN_WIDTH < 900 ? 72 : 80;
const MENU_ITEM_SIZE = 70;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function DashboardScreen() {
  const { speak } = useTTS();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const { voiceGuideEnabled, toggleVoiceGuide, isOnline, setOnlineStatus, userData } = useAuth();

  // NexaSafe tracking
  const { trackScreenVisit, trackTap, trackTapDuration, trackSwipe, isSessionActive } = useNexaSafe();

  // Tap timing refs
  const tapStartTime = useRef<number>(0);
  const scrollStartY = useRef<number>(0);
  const scrollStartTime = useRef<number>(0);

  // Track screen visit on mount
  useEffect(() => {
    if (isSessionActive) {
      trackScreenVisit('Dashboard');
    }
  }, [isSessionActive]);

  // Handle tap start (for duration tracking)
  const handleTapStart = (e: GestureResponderEvent) => {
    tapStartTime.current = Date.now();
  };

  // Handle tap end with tracking
  const handleTapEnd = (e: GestureResponderEvent, zone: string = 'active') => {
    if (isSessionActive) {
      const { locationX, locationY } = e.nativeEvent;
      const duration = Date.now() - tapStartTime.current;
      trackTap('Dashboard', locationX, locationY, zone);
      trackTapDuration('Dashboard', duration);
    }
  };

  // Handle scroll start
  const handleScrollBegin = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollStartY.current = e.nativeEvent.contentOffset.y;
    scrollStartTime.current = Date.now();
  };

  // Handle scroll end
  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSessionActive) {
      const endY = e.nativeEvent.contentOffset.y;
      const duration = Date.now() - scrollStartTime.current;
      trackSwipe(scrollStartY.current, endY, duration);
    }
  };

  // Wake word: "Hey Nexa"
  useWakeWord(() => {
    speak("Opening Voice Assistant");
    navigation.navigate("VoiceAssistant");
  });

  const accountBalance = 5250.75;

  /* ---------------------------- SOS BUTTON --------------------------- */
  function SOSButton({ onPress }: { onPress: () => void }) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        onPress={() => {
          speak("SOS Emergency");
          onPress();
        }}
        onPressIn={() => (scale.value = withSpring(0.9))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={[styles.sosButton, { backgroundColor: KAVACHColors.sos }, Shadows.md, animatedStyle]}
      >
        <Feather name="alert-triangle" size={16} color="#FFFFFF" />
        <ThemedText style={styles.sosText}>SOS</ThemedText>
      </AnimatedPressable>
    );
  }

  /* ---------------------------- FEATURE CARD COMPONENT --------------------------- */
  function FeatureCard({
    source,
    label,
    onPress,
  }: {
    source: any;
    label: string;
    onPress: () => void;
  }) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          if (Platform.OS === "web") {
            scale.value = withTiming(1.02, { duration: 300, easing: Easing.ease });
          } else {
            scale.value = withSpring(0.98);
          }
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[styles.featureCard, animatedStyle]}
      >
        <ImageBackground
          source={source}
          style={styles.featureImageBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.featureOverlay}
          />
          <ThemedText style={styles.featureLabel}>{label}</ThemedText>
        </ImageBackground>
      </AnimatedPressable>
    );
  }

  /* --------------------------- MAIN SCREEN ---------------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + Spacing.xl }}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
      >
        <View style={styles.container}>
          {/* ----------------------------- HEADER WITH CONTROLS ------------------------------ */}
          <View style={styles.headerControls}>
            <SOSButton onPress={() => navigation.navigate("SOS")} />
            <Pressable
              onPressIn={handleTapStart}
              onPressOut={(e) => handleTapEnd(e, 'settings-button')}
              onPress={() => {
                speak("Settings");
                navigation.navigate("Settings");
              }}
              style={styles.iconButton}
            >
              <Feather name="settings" size={22} color="#333" />
            </Pressable>
          </View>

        {/* ----------------------------- CARDS SECTION ------------------------------ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsContainer}
        >
          {/* Bank Account Card */}
          {userData?.bankName && (
            <View style={[styles.card, { backgroundColor: "#4CAF50" }]}>
              <View style={styles.cardContent}>
                <View>
                  <ThemedText type="caption" style={{ color: "#FFF" }}>{userData.bankName}</ThemedText>
                  <ThemedText type="small" style={{ color: "#FFF", marginTop: 4 }}>{userData.bankAccountMasked}</ThemedText>
                </View>
                <ThemedText type="h4" style={{ color: "#FFF" }}>
                  ₹ {accountBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </ThemedText>
              </View>
              <Feather name="check-circle" size={20} color="#FFF" style={{ position: 'absolute', top: 16, right: 16 }} />
            </View>
          )}

          {/* Add Card Placeholder */}
          <Pressable 
            style={[styles.card, styles.addCard]}
            onPress={() => {
              speak("Add Bank Account");
              navigation.navigate("BankLinking");
            }}
          >
            <Feather name="plus" size={32} color="#999" />
            <ThemedText type="small" style={{ color: "#999", marginTop: 8 }}>Add Bank</ThemedText>
          </Pressable>
        </ScrollView>

        {/* ----------------------------- VOICE & NETWORK CONTROLS ------------------------------ */}
        <View style={styles.section}>
          <View style={styles.featureCardsRow}>
            <FeatureCard
              source={require("../assets/images/voice-assistant.avif")}
              label="VOICE ASSISTANT"
              onPress={() => {
                speak("Voice Assistant");
                navigation.navigate("VoiceAssistant");
              }}
            />
            <FeatureCard
              source={require("../assets/images/scanner.webp")}
              label="SCANNER"
              onPress={() => {
                speak("Scanner");
                navigation.navigate("OfflineOtp");
              }}
            />
            <FeatureCard
              source={require("../assets/images/behavior.jpg")}
              label="RECENT ACTIVITY"
              onPress={() => {
                speak("Recent Activity");
                navigation.navigate("TransactionHistory");
              }}
            />
          </View>
        </View>

        {/* ----------------------------- QUICK ACTIONS ------------------------------ */}
        <View style={styles.section}>
          <View style={styles.featureCardsRow}>
            <FeatureCard
              source={require("../assets/images/malware.jpg")}
              label="SCAN MESSAGE FOR FRAUD"
              onPress={() => {
                speak("Scan for Fraud");
                navigation.navigate("FraudScan");
              }}
            />
            <FeatureCard
              source={require("../assets/images/feature2.png")}
              label="SEND MONEY"
              onPress={() => {
                speak("Send Money");
                navigation.navigate("SendMoney");
              }}
            />
            <FeatureCard
              source={require("../assets/images/bank.jpg")}
              label="BALANCE"
              onPress={() => {
                speak("Balance");
                navigation.navigate("Balance");
              }}
            />
          </View>
        </View>

        {/* ----------------------------- SECURITY & ANALYTICS ------------------------------ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={{ color: "#1A1A1A" }}>Security & Analytics</ThemedText>
          </View>
          <View style={styles.featureCardsRow}>
            <FeatureCard
              source={require("../assets/images/security_dashboard.jpg")}
              label="SECURITY DASHBOARD"
              onPress={() => {
                speak("Security Dashboard");
                navigation.navigate("SecurityDashboard");
              }}
            />
            <FeatureCard
              source={require("../assets/images/behavior.jpg")}
              label="BEHAVIOR ANALYTICS"
              onPress={() => {
                speak("Behavior Analytics");
                navigation.navigate("BehaviorAnalytics");
              }}
            />
            <FeatureCard
              source={require("../assets/images/qr_scanner.avif")}
              label="QR SCANNER"
              onPress={() => {
                speak("QR Scanner");
                navigation.navigate("QRScanner");
              }}
            />
          </View>
        </View>

        {/* ----------------------------- TRANSACTIONS CHART ------------------------------ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="h4" style={{ color: "#1A1A1A" }}>Transactions in December</ThemedText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable style={[styles.filterChip, { backgroundColor: "#1A1A1A" }]}>
                <ThemedText type="caption" style={{ color: "#FFF" }}>Spending</ThemedText>
              </Pressable>
              <Pressable style={styles.filterChip}>
                <ThemedText type="caption" style={{ color: "#666" }}>Deposits</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {/* Donut Chart Placeholder */}
            <View style={styles.donutChart}>
              <View style={styles.donutHole}>
                <ThemedText type="caption" style={{ color: "#999" }}>Total spending</ThemedText>
                <ThemedText type="h4" style={{ color: "#1A1A1A" }}>₹ 2,683.21</ThemedText>
              </View>
            </View>

            {/* Categories */}
            <View style={styles.categories}>
              <View style={styles.categoryTag}>
                <View style={[styles.categoryDot, { backgroundColor: "#64B5F6" }]} />
                <ThemedText type="caption" style={{ color: "#666" }}>Food 31%</ThemedText>
              </View>
              <View style={styles.categoryTag}>
                <View style={[styles.categoryDot, { backgroundColor: "#FFB74D" }]} />
                <ThemedText type="caption" style={{ color: "#666" }}>Learning 24%</ThemedText>
              </View>
              <View style={styles.categoryTag}>
                <View style={[styles.categoryDot, { backgroundColor: "#FFD54F" }]} />
                <ThemedText type="caption" style={{ color: "#666" }}>Health 20%</ThemedText>
              </View>
              <View style={styles.categoryTag}>
                <View style={[styles.categoryDot, { backgroundColor: "#81C784" }]} />
                <ThemedText type="caption" style={{ color: "#666" }}>Taxi 16%</ThemedText>
              </View>
              <View style={styles.categoryTag}>
                <View style={[styles.categoryDot, { backgroundColor: "#BA68C8" }]} />
                <ThemedText type="caption" style={{ color: "#666" }}>Online shopping 9%</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* UPI Education Section */}
        <View style={[styles.upiSection, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h4" style={[styles.upiTitle, { color: theme.text }]}>
            UPI & How It Works
          </ThemedText>

          <Pressable
            style={[styles.upiButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("UpiLearning")}
          >
            <ThemedText style={styles.upiButtonText}>Learn About UPI & Safety</ThemedText>
          </Pressable>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------ STYLES ------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  headerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: "#F5F7FA",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  balanceSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mainBalance: {
    fontSize: 40,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F5F7FA",
    borderRadius: 20,
  },
  cardsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    width: 180,
    height: 140,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    ...Shadows.md,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  addCard: {
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F5F7FA",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  actionButton: {
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 9,
    textAlign: "center",
    color: "#666",
    lineHeight: 12,
  },
  chartContainer: {
    backgroundColor: "#FFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  donutChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 20,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
  },
  donutHole: {
    alignItems: "center",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: "#F5F7FA",
    borderRadius: BorderRadius.full,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  controlsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  featureCardsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    justifyContent: "space-between",
  },
  featureCard: {
    flex: 1,
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#F5F7FA",
    ...Shadows.md,
  },
  featureImageBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  featureOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  featureLabel: {
    position: "relative",
    bottom: 20,
    textAlign: "center",
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
    zIndex: 10,
    paddingBottom: 10,
  },
  controlButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
    ...Shadows.md,
  },
  controlLabel: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  tileImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    backgroundColor: KAVACHColors.sos,
    ...Shadows.md,
  },
  sosText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  networkToggle: {
    flexDirection: "row",
    alignItems: "center",
  },
  voiceGuideToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  upiSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadows.sm,
  },
  upiTitle: {
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  upiButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  upiButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

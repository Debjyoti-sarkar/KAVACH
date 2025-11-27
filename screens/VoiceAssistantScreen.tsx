import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spacing, BorderRadius, NexaVaultColors, Shadows } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootNavigator";

const SAMPLE_COMMANDS = [
  "Send 500 to Rahul",
  "Check my balance",
  "Show recent transactions",
  "Pay electricity bill",
  "Send money to Priya",
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function VoiceAssistantScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<"idle" | "listening" | "processing">("idle");

  const pulseScale = useSharedValue(1);
  const waveScale1 = useSharedValue(1);
  const waveScale2 = useSharedValue(1);
  const waveScale3 = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );

      waveScale1.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
      waveScale2.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      waveScale3.value = withRepeat(
        withSequence(
          withTiming(2.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
      waveScale1.value = withSpring(1);
      waveScale2.value = withSpring(1);
      waveScale3.value = withSpring(1);
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale1.value }],
    opacity: isListening ? 0.3 : 0,
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale2.value }],
    opacity: isListening ? 0.2 : 0,
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale3.value }],
    opacity: isListening ? 0.1 : 0,
  }));

  const handleMicPress = () => {
    if (status === "idle") {
      setIsListening(true);
      setStatus("listening");
      setTranscript("");

      setTimeout(() => {
        setStatus("processing");
        setIsListening(false);
        setTranscript(SAMPLE_COMMANDS[Math.floor(Math.random() * SAMPLE_COMMANDS.length)]);

        setTimeout(() => {
          setStatus("idle");
        }, 2000);
      }, 3000);
    }
  };

  const handleSuggestion = (command: string) => {
    setTranscript(command);
    setStatus("processing");
    
    setTimeout(() => {
      if (command.toLowerCase().includes("send")) {
        navigation.navigate("SendMoney");
      } else if (command.toLowerCase().includes("balance")) {
        navigation.navigate("Balance");
      } else if (command.toLowerCase().includes("transaction")) {
        navigation.navigate("TransactionHistory");
      }
    }, 1500);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="h3">{t("voiceAssistant")}</ThemedText>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.micContainer}>
          <Animated.View style={[styles.wave, wave3Style, { backgroundColor: NexaVaultColors.voiceAssistant }]} />
          <Animated.View style={[styles.wave, wave2Style, { backgroundColor: NexaVaultColors.voiceAssistant }]} />
          <Animated.View style={[styles.wave, wave1Style, { backgroundColor: NexaVaultColors.voiceAssistant }]} />
          
          <AnimatedPressable
            onPress={handleMicPress}
            disabled={status !== "idle"}
            style={[
              styles.micButton,
              { backgroundColor: NexaVaultColors.voiceAssistant },
              Shadows.lg,
              pulseStyle,
            ]}
          >
            <Feather
              name={status === "processing" ? "loader" : "mic"}
              size={48}
              color="#FFFFFF"
            />
          </AnimatedPressable>
        </View>

        <ThemedText style={styles.statusText}>
          {status === "idle" && t("tapToSpeak")}
          {status === "listening" && t("listening")}
          {status === "processing" && t("processing")}
        </ThemedText>

        {transcript ? (
          <View style={[styles.transcriptCard, { backgroundColor: theme.card }, Shadows.md]}>
            <Feather name="message-circle" size={20} color={NexaVaultColors.voiceAssistant} />
            <ThemedText style={styles.transcriptText}>"{transcript}"</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.suggestions}>
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
          Try saying:
        </ThemedText>
        <View style={styles.suggestionChips}>
          {SAMPLE_COMMANDS.slice(0, 3).map((command, index) => (
            <Pressable
              key={index}
              onPress={() => handleSuggestion(command)}
              style={[styles.suggestionChip, { backgroundColor: theme.backgroundSecondary }]}
            >
              <ThemedText type="small">"{command}"</ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {Platform.OS === "web" ? (
        <View style={[styles.webNotice, { backgroundColor: NexaVaultColors.info + "20" }]}>
          <Feather name="info" size={16} color={NexaVaultColors.info} />
          <ThemedText type="caption" style={{ color: NexaVaultColors.info, marginLeft: Spacing.sm, flex: 1 }}>
            Voice recognition works best in Expo Go on your device.
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing["3xl"],
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  micContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  wave: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  statusText: {
    fontSize: 18,
    marginBottom: Spacing.xl,
  },
  transcriptCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    maxWidth: "90%",
  },
  transcriptText: {
    flex: 1,
    fontSize: 16,
    fontStyle: "italic",
  },
  suggestions: {
    paddingVertical: Spacing.xl,
  },
  suggestionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  suggestionChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
});

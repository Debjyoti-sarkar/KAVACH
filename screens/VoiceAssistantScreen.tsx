// screens/VoiceAssistantScreen.tsx
import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Speech from "expo-speech";
import { useNavigation } from "@react-navigation/native";

import VoiceRecorder, { VoiceRecorderHandle } from "../components/VoiceRecorder";
import { AssistantInput } from "../components/AssistantInput";
import { TestConnection } from "../components/TestConnection";
import { parseText, ParseResponse } from "../services/assistant";
import { useTheme } from "../hooks/useTheme";

export default function VoiceAssistantScreen() {
  const navigation = useNavigation<any>();
  const recorderRef = useRef<VoiceRecorderHandle | null>(null);
  const { theme } = useTheme();

  const [messages, setMessages] = useState([
    {
      id: "0",
      text: "Hello! I'm your payment assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const add = (txt: string, isUser: boolean, intent?: string) => {
    setMessages((m) => [
      ...m,
      { id: Date.now().toString(), text: txt, isUser, intent, timestamp: new Date() },
    ]);
  };

  /** --------------------------
   * PROCESS TEXT FROM USER
   * ---------------------------*/
  const process = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;

      add(userText, true);
      setBusy(true);

      try {
        const parsed: ParseResponse = await parseText(userText);

        add(parsed.replyText, false, parsed.intent);

        Speech.speak(parsed.replyText, { rate: 0.9 });

        switch (parsed.actionSuggested) {
          case "prefill_and_navigate_upi":
            navigation.navigate("SendMoney", parsed.entities || {});
            break;

          case "ask_pin_for_balance":
            navigation.navigate("Balance");
            break;

          case "show_history":
            navigation.navigate("TransactionHistory");
            break;

          case "scan_qr":
            navigation.navigate("QRScanner");
            break;

          case "check_fraud":
            navigation.navigate("FraudScan");
            break;

          case "help_support_page":
            navigation.navigate("HelpFaq");
            break;

          default:
            break;
        }
      } catch (err) {
        console.log("❌ Parse error:", err);
        add("I couldn't understand that. Please try again.", false);
      } finally {
        setBusy(false);
      }
    },
    [navigation]
  );

  /** --------------------------
   * HANDLE TRANSCRIBED AUDIO
   * ---------------------------*/
  const onTranscribed = (txt: string) => {
    if (!txt.trim()) {
      add("Sorry, I didn't catch that.", false);
      return;
    }
    process(txt);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Voice Assistant</Text>
          <Text style={styles.subtitle}>Speak or type your request</Text>
        </View>

        <TestConnection />

        <ScrollView contentContainerStyle={styles.msgContent}>
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.isUser ? styles.userBubble : styles.botBubble,
              ]}
            >
              <Text style={{ color: m.isUser ? "#fff" : "#333" }}>
                {m.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <VoiceRecorder ref={recorderRef} onTranscribed={onTranscribed} />

        <AssistantInput
          text={text}
          setText={setText}
          onSend={() => {
            process(text);
            setText("");
          }}
          disabled={busy}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { marginTop: 4, color: "#777" },
  msgContent: { padding: 16 },
  bubble: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#EEE",
  },
});

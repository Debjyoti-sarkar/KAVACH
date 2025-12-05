// components/VoiceRecorder.tsx
import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Audio } from "expo-av"; // ✔ correct import
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { TRANSCRIBE_URL, PARSE_URL } from "../services/assistant";
import * as Speech from "expo-speech";
import { useNavigation } from "@react-navigation/native";

export type VoiceRecorderHandle = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isRecording: () => boolean;
};

export interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  useAssistantEndpoint?: boolean;
  enableAssistantFlow?: boolean;
  showUI?: boolean;
  primaryColor?: string;
}

const VoiceRecorder = forwardRef<VoiceRecorderHandle, VoiceRecorderProps>(
  (
    {
      onTranscribed,
      useAssistantEndpoint = true,
      enableAssistantFlow = false,
      showUI = true,
      primaryColor = "#007AFF",
    },
    ref
  ) => {
    const navigation = useNavigation<any>();

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [status, setStatus] = useState<"idle" | "recording" | "sending">(
      "idle"
    );

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (recording) {
          recording.stopAndUnloadAsync().catch(() => {});
        }
      };
    }, [recording]);

    // -----------------------------
    // 🟢 START RECORDING
    // -----------------------------
    async function startRecording() {
      try {
        console.log("🎤 Requesting mic permissions…");

        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Microphone Permission Required",
            "Enable microphone permission in settings."
          );
          return;
        }

        console.log("🎤 Permissions granted");

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        console.log("🎤 Audio mode set.");

        const rec = new Audio.Recording();

        await rec.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        await rec.startAsync();
        console.log("🎤 Recording started!");

        setRecording(rec);
        setStatus("recording");
      } catch (err) {
        console.log("🚨 Recording start error:", err);
        Alert.alert(
          "Error",
          "Could not start recording. Please check microphone permission and try again."
        );
      }
    }

    // -----------------------------
    // 🛑 STOP RECORDING
    // -----------------------------
    async function stopRecording() {
      try {
        if (!recording) return;

        setStatus("sending");
        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();
        console.log("🎤 File URI:", uri);

        setRecording(null);

        if (!uri) throw new Error("No audio file URI");

        // Convert audio → FormData
        const formData = new FormData();
        formData.append("audio", {
          uri,
          name: "recording.m4a",
          type: "audio/m4a",
        } as any);

        // ------------------------------------------------------
        // 🔥 IMPORTANT FIX: prevent Expo from corrupting uploads
        // ------------------------------------------------------
        const res = await fetch(TRANSCRIBE_URL, {
          method: "POST",
          headers: undefined, // << 🔥 FIX HERE
          body: formData,
        });

        const json = await res.json();
        const text = json?.text || "";

        console.log("📝 Transcribed text:", text);
        onTranscribed(text);
      } catch (err) {
        console.log("🚨 Stop recording error:", err);
        Alert.alert("Error", "Failed to process audio.");
      } finally {
        setStatus("idle");
      }
    }

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      start: startRecording,
      stop: stopRecording,
      isRecording: () => status === "recording",
    }));

    // UI
    if (!showUI) return null;

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: status === "recording" ? "#FF3B30" : primaryColor },
          ]}
          disabled={status === "sending"}
          onPress={() => {
            if (status === "recording") stopRecording();
            else startRecording();
          }}
        >
          {status === "sending" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons
              name={status === "recording" ? "stop" : "mic"}
              size={28}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {status === "idle" && "Tap to record"}
          {status === "recording" && "Recording… Tap to stop"}
          {status === "sending" && "Processing audio…"}
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 12 },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: { marginTop: 8, fontSize: 14, color: "#666" },
});

VoiceRecorder.displayName = "VoiceRecorder";
export default VoiceRecorder;

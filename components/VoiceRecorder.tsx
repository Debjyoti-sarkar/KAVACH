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

import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { TRANSCRIBE_URL } from "../services/assistant";

export type VoiceRecorderHandle = {
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  isRecording: () => boolean;
};

const VoiceRecorder = forwardRef<VoiceRecorderHandle, any>(
  ({ onTranscribed, primaryColor = "#007AFF" }, ref) => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isSending, setIsSending] = useState(false);

    /** Clean up properly */
    useEffect(() => {
      return () => {
        if (recording) {
          recording.stopAndUnloadAsync().catch(() => {});
        }
      };
    }, [recording]);

    /** --------------------------
     *  START RECORDING
     * ---------------------------*/
    const start = async () => {
      try {
        if (recording) {
          console.log("⚠️ Recorder already active. Stopping previous instance.");
          await recording.stopAndUnloadAsync().catch(() => {});
          setRecording(null);
        }

        console.log("🎤 Requesting mic permission…");

        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== "granted") {
          Alert.alert("Microphone permission required.");
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const rec = new Audio.Recording();

        // Required fix so Expo doesn't throw errors
        await rec.prepareToRecordAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        await rec.startAsync();
        console.log("🎤 Recording started");
        setRecording(rec);
      } catch (err) {
        console.log("❌ Start error:", err);
      }
    };

    /** --------------------------
     *  STOP & UPLOAD
     * ---------------------------*/
    const stop = async () => {
      try {
        if (!recording) return null;

        setIsSending(true);

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (!uri) {
          console.log("❌ No URI from recorder");
          return null;
        }

        console.log("🎤 File URI:", uri);

        const formData = new FormData();
        formData.append("audio", {
          uri,
          name: "recording.m4a",
          type: "audio/m4a",
        } as any);

        console.log("📡 Uploading audio →", TRANSCRIBE_URL);

        const res = await fetch(TRANSCRIBE_URL, {
          method: "POST",
          headers: undefined,
          body: formData,
        });

        const json = await res.json();
        const text = json?.text?.trim() || "";

        console.log("📝 Transcript:", text);

        if (text.length === 0) {
          console.log("⚠️ Empty transcription");
        }

        onTranscribed(text);
        return text;
      } catch (err) {
        console.log("❌ Stop/upload error:", err);
        Alert.alert("Error", "Failed to process audio.");
        return null;
      } finally {
        setIsSending(false);
      }
    };

    /** Expose to parent */
    useImperativeHandle(ref, () => ({
      start,
      stop,
      isRecording: () => !!recording,
    }));

    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            if (recording) stop();
            else start();
          }}
          style={[
            styles.micButton,
            { backgroundColor: recording ? "#E53935" : primaryColor },
          ]}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons
              name={recording ? "stop" : "mic"}
              size={28}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        <Text style={styles.status}>
          {recording && !isSending && "Recording… Tap to stop"}
          {!recording && !isSending && "Tap to record"}
          {isSending && "Processing…"}
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 12 },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  status: { marginTop: 8, fontSize: 14, color: "#666" },
});

export default VoiceRecorder;
  
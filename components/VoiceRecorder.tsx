// components/VoiceRecorder.tsx
import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from "../services/api";
import { TRANSCRIBE_URL } from "../services/assistant";

/**
 * Exposed imperative methods: start(), stop()
 * Use: const ref = useRef<VoiceRecorderHandle>(null); ref.current?.start();
 */
export type VoiceRecorderHandle = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isRecording: () => boolean;
};

export interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  useAssistantEndpoint?: boolean; // If true, use /assistant/transcribe, else use /stt
  showUI?: boolean; // Whether to show the built-in UI
  primaryColor?: string;
}

export const VoiceRecorder = forwardRef<VoiceRecorderHandle, VoiceRecorderProps>(
  ({ onTranscribed, useAssistantEndpoint = false, showUI = true, primaryColor = '#007AFF' }, ref) => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [status, setStatus] = useState<"idle" | "recording" | "sending">("idle");
    const [isStarting, setIsStarting] = useState(false);

    // Use an options object but cast to any to avoid SDK/type mismatch
    const recordingOptions: any = {
      ios: {
        extension: ".caf",
        bitRate: 128000,
        sampleRate: 44100,
        numberOfChannels: 1,
        linearPCMBitDepth: 16,
      },
      android: {
        extension: ".m4a",
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        recording?.stopAndUnloadAsync().catch(() => {});
      };
    }, []);

    async function startRecording() {
      try {
        // Guard: prevent concurrent start attempts
        if (recording || status !== "idle" || isStarting) {
          console.log("Already recording or starting, ignoring...");
          return;
        }

        setIsStarting(true);

        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission required", "Microphone permission is needed to record audio.");
          setIsStarting(false);
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const rec = new Audio.Recording();
        await rec.prepareToRecordAsync(recordingOptions as any);
        await rec.startAsync();
        setRecording(rec);
        setStatus("recording");
        setIsStarting(false);
      } catch (err) {
        console.log("Recording start error:", err);
        setIsStarting(false);
        Alert.alert("Error", "Failed to start recording. Please try again.");
      }
    }

    async function stopRecording() {
      try {
        if (!recording) return;
        setStatus("sending");
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);

        if (!uri) {
          throw new Error("No recording URI");
        }

        let text = "";

        if (useAssistantEndpoint) {
          // Use multipart form data for /assistant/transcribe
          const formData = new FormData();
          const filename = uri.split('/').pop() || 'audio.m4a';
          
          formData.append('audio', {
            uri: uri,
            name: filename,
            type: 'audio/m4a',
          } as any);

          const res = await fetch(TRANSCRIBE_URL, {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Transcription failed: ${res.status}`);
          }

          const json = await res.json();
          text = typeof json?.text === "string" ? json.text : "";
        } else {
          // Use base64 for /stt endpoint (legacy)
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });

          const res = await fetch(`${BASE_URL}/stt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: base64, fileName: "recording.m4a" }),
          });

          const json = await res.json();
          text = typeof json?.text === "string" ? json.text : "";
        }

        onTranscribed(text);
      } catch (e) {
        console.log("Stop recording error:", e);
        Alert.alert("Error", "Failed to process recording. Please try again.");
      } finally {
        setStatus("idle");
      }
    }

    // Expose start/stop to parent via ref
    useImperativeHandle(ref, () => ({
      start: startRecording,
      stop: stopRecording,
      isRecording: () => status === "recording",
    }));

    // Optionally render UI controls
    if (!showUI) {
      return null;
    }

    const handlePress = () => {
      if (status === "recording") {
        stopRecording();
      } else if (status === "idle") {
        startRecording();
      }
    };

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.micButton,
            { backgroundColor: status === "recording" ? '#FF3B30' : primaryColor },
            status === "sending" && styles.micButtonDisabled,
          ]}
          onPress={handlePress}
          disabled={status === "sending"}
        >
          {status === "sending" ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={status === "recording" ? "stop" : "mic"}
              size={28}
              color="#fff"
            />
          )}
        </TouchableOpacity>
        <Text style={styles.statusText}>
          {status === "idle" && "Tap to speak"}
          {status === "recording" && "Recording... Tap to stop"}
          {status === "sending" && "Processing..."}
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 12,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  micButtonDisabled: {
    opacity: 0.6,
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

VoiceRecorder.displayName = "VoiceRecorder";

// Provide a default export as well for compatibility with default-import usage
export default VoiceRecorder;

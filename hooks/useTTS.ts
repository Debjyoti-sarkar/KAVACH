import { Buffer } from "buffer";
import { useCallback } from "react";
import { Paths, File } from "expo-file-system";
import { Audio } from "expo-av";
import { BASE_URL } from "@/services/api"; // ensure this is correct: http://<your-laptop-ip>:5000

export function useTTS() {
  const speak = useCallback(async (text: string, lang = "en-IN") => {
    try {
      // 1) ask backend for audio
      const resp = await fetch(`${BASE_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang, format: "mp3" }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.warn("TTS backend error:", t);
        return;
      }

      const json = await resp.json();
      const base64 = json.audio;
      if (!base64) return;

      // 2) write file to cache
      const cacheFile = new File(Paths.cache, `tts_${Date.now()}.mp3`);
      await cacheFile.write(Buffer.from(base64, "base64"));

      // 3) play it
      const { sound } = await Audio.Sound.createAsync({ uri: cacheFile.uri });
      await sound.playAsync();

      // optional: cleanup after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying) {
          sound.unloadAsync();
        }
      });
    } catch (err) {
      console.error("useTTS error:", err);
    }
  }, []);

  return { speak };
}

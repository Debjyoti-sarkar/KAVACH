import { useEffect } from "react";
import { PorcupineManager } from "@picovoice/porcupine-react-native";

export function useWakeWord(onWake: () => void) {
  useEffect(() => {
    let manager: PorcupineManager | null = null;

    async function start() {
      manager = await PorcupineManager.fromKeywordPaths(
        "porcupine_params.pv",    // engine params file
        ["hey-nexa.ppn"],           // your custom wake word file
        (keywordIndex) => {
          console.log("Wake word detected!");
          onWake();
        }
      );
      await manager.start();
    }

    start();

    return () => {
      manager?.stop();
      manager?.delete();
    };
  }, []);
}

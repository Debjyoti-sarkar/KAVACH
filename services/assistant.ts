// Your backend is running on PORT 3001 (NOT 3000)
export const BASE_URL = "http://192.168.0.180:3001";

export const TRANSCRIBE_URL = BASE_URL + "/assistant/transcribe";
export const PARSE_URL = BASE_URL + "/assistant/parse";

// Types for API responses
export interface ParseResponse {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  replyText: string;
  actionSuggested: string;
}

export interface TranscribeResponse {
  text: string;
}

export interface HealthResponse {
  status: string;
  timestamp?: string;
  uptime?: number;
}

/**
 * Parse text using the backend NLU
 * @param text - The text to parse
 * @returns ParseResponse with intent, entities, confidence, replyText, and actionSuggested
 */
export async function parseText(text: string): Promise<ParseResponse> {
  try {
    const response = await fetch(PARSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Parse request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error parsing text:', error);
    throw error;
  }
}

/**
 * Transcribe audio file using the backend STT service
 * @param audioUri - The URI of the audio file to transcribe
 * @returns TranscribeResponse with transcribed text
 */
export async function transcribeAudio(audioUri: string): Promise<TranscribeResponse> {
  try {
    const formData = new FormData();

    const filename = audioUri.split('/').pop() || 'recording.m4a';

    // Correct Expo upload behavior → DO NOT SET Content-Type manually
    formData.append('audio', {
      uri: audioUri,
      name: filename,
      type: 'audio/m4a',
    } as any);

    const response = await fetch(TRANSCRIBE_URL, {
      method: 'POST',
      body: formData,    // No headers → let RN set boundary correctly
    });

    if (!response.ok) {
      throw new Error(`Transcribe request failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Check backend health status
 * @returns HealthResponse with status and optional metadata
 */
export async function healthCheck(): Promise<HealthResponse> {
  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
}

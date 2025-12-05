import * as SecureStore from "expo-secure-store";
import CryptoJS from "crypto-js";

/*------------------------------------------------------------------
  SECURE PIN
------------------------------------------------------------------*/
const PIN_KEY = "secure_pin_hash";

export async function saveSecurePin(pin: string) {
  const hash = CryptoJS.SHA256(pin).toString();
  await SecureStore.setItemAsync(PIN_KEY, hash);
}

export async function verifySecurePin(pin: string) {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;
  return CryptoJS.SHA256(pin).toString() === stored;
}

/*------------------------------------------------------------------
  SECURE BIOMETRIC FLAG
------------------------------------------------------------------*/
const BIO_KEY = "secure_biometric_flag";

export async function saveBiometricFlag(enabled: boolean) {
  await SecureStore.setItemAsync(BIO_KEY, enabled ? "1" : "0");
}

export async function isBiometricEnabledSecure() {
  const v = await SecureStore.getItemAsync(BIO_KEY);
  return v === "1";
}

/*------------------------------------------------------------------
  SECURE AADHAAR TOKEN
------------------------------------------------------------------*/
const AADHAAR_KEY = "aadhaar_token_secure";

export async function saveAadhaar(aadhaar: string) {
  const token = CryptoJS.SHA256(aadhaar).toString();
  await SecureStore.setItemAsync(AADHAAR_KEY, token);
}

export async function isAadhaarLinkedSecure() {
  const token = await SecureStore.getItemAsync(AADHAAR_KEY);
  return !!token;
}

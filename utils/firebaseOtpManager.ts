// utils/firebaseOtpManager.ts
import { auth } from "./firebaseConfig";
import {
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";

let globalVerificationId: string | null = null;

export async function sendFirebaseOTP(
  phoneNumber: string,
  recaptchaVerifier: any
): Promise<{ success: boolean; error?: string; verificationId?: string }> {
  try {
    const formattedPhone = `+91${phoneNumber}`;
    console.log("📱 Sending OTP to:", formattedPhone);

    const phoneProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneProvider.verifyPhoneNumber(
      formattedPhone,
      recaptchaVerifier
    );

    globalVerificationId = verificationId;
    console.log("✅ OTP Sent Successfully!");
    
    return { success: true, verificationId };
    
  } catch (error: any) {
    console.error("❌ Error sending OTP:", error);
    
    let errorMessage = "Failed to send OTP. Please try again.";
    
    if (error.code === "auth/invalid-phone-number") {
      errorMessage = "Invalid phone number. Please check and try again.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many attempts. Please wait a few minutes.";
    } else if (error.code === "auth/quota-exceeded") {
      errorMessage = "Daily SMS limit reached. Try again tomorrow.";
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function verifyFirebaseOTP(
  otpCode: string,
  verificationId?: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const vidToUse = verificationId || globalVerificationId;
    
    if (!vidToUse) {
      return { 
        success: false, 
        error: "No verification in progress. Please request OTP first." 
      };
    }

    console.log("🔍 Verifying OTP code:", otpCode);

    const credential = PhoneAuthProvider.credential(vidToUse, otpCode);
    const userCredential = await signInWithCredential(auth, credential);

    console.log("✅ OTP Verified Successfully!");
    globalVerificationId = null;
    
    return { success: true, userId: userCredential.user.uid };
    
  } catch (error: any) {
    console.error("❌ Error verifying OTP:", error);
    
    let errorMessage = "Invalid OTP. Please try again.";
    
    if (error.code === "auth/invalid-verification-code") {
      errorMessage = "Wrong OTP code. Please check and try again.";
    } else if (error.code === "auth/code-expired") {
      errorMessage = "OTP expired. Please request a new one.";
    }
    
    return { success: false, error: errorMessage };
  }
}

export function clearVerification() {
  globalVerificationId = null;
}
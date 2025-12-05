// utils/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCBFZJvo-u5hb0Zhjso2ok5x_yS-2FPQq0",
  authDomain: "nexavault-dfd20.firebaseapp.com",
  projectId: "nexavault-dfd20",
  storageBucket: "nexavault-dfd20.firebasestorage.app",
  messagingSenderId: "164623870538",
  appId: "1:164623870538:web:3925057c35164c9b7254b3",
  measurementId: "G-T10HHXC50R"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
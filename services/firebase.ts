import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBV1GCeolvn9QbQaVEObQYh4JXxzmRz0fI",
  authDomain: "edusmart-358f2.firebaseapp.com",
  projectId: "edusmart-358f2",
  storageBucket: "edusmart-358f2.appspot.com",
  messagingSenderId: "12407352440",
  appId: "1:12407352440:web:43f5f41022135dfcbd518d",
  measurementId: "G-XLFQLLHJ5H"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

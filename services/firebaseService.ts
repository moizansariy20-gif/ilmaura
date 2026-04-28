import { messaging, app } from "./firebase.ts";
import { getToken, onMessage } from "firebase/messaging";
import { supabase } from "./supabase.ts";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const requestNotificationPermission = async (userId: string) => {
  if (!messaging) {
    console.warn("Messaging not supported or initialized");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      
      let swRegistration = null;
      if ('serviceWorker' in navigator) {
        // Wait for the service worker to be ready to ensure it's active
        swRegistration = await navigator.serviceWorker.ready;
        console.log("Service Worker ready:", swRegistration);
      }

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration || undefined
      });

      if (token) {
        console.log("FCM Token:", token);
        await saveTokenToSupabase(userId, token);
        return token;
      } else {
        console.warn("No registration token available. Request permission to generate one.");
      }
    } else {
      console.warn("Unable to get permission to notify.");
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
  }
  return null;
};

const saveTokenToSupabase = async (userId: string, token: string) => {
  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({ fcm_token: token })
      .eq("id", userId);

    if (error) {
      console.error("Error saving FCM token to Supabase:", error);
    } else {
      console.log("FCM token saved to Supabase successfully.");
    }
  } catch (err) {
    console.error("Exception saving FCM token:", err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      resolve(payload);
    });
  });

// Function to send notification via a Supabase Edge Function or similar backend
// Since we don't have a backend here, we'll just log it.
// In a real app, you'd call a function that uses the Firebase Admin SDK.
export const sendPushNotification = async (token: string, title: string, body: string, data?: any) => {
  try {
    console.log(`Attempting to send alert to token: ${token}`);
    const response = await fetch("/api/deliver-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, title, body, data }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to send notification";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Server returned ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    console.log("Push notification sent successfully via backend.");
  } catch (err: any) {
    console.error("Error sending push notification:", err.message || err);
  }
};

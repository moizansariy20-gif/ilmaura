import { useState, useEffect } from "react";
import { requestNotificationPermission, onMessageListener } from "../services/firebaseService.ts";
import { useAuth } from "./useAuth.ts";

export const useNotifications = () => {
  const { user, profile } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  useEffect(() => {
    if (user && profile) {
      const setupNotifications = async () => {
        const fcmToken = await requestNotificationPermission(user.id);
        if (fcmToken) {
          setToken(fcmToken);
        }
      };

      setupNotifications();
    }
  }, [user, profile]);

  useEffect(() => {
    const listenForMessages = async () => {
      const payload = await onMessageListener();
      if (payload) {
        setNotification(payload);
        // You can show a toast or custom notification UI here
        console.log("Foreground Notification:", payload);
      }
    };

    listenForMessages();
  }, []);

  return { token, notification };
};

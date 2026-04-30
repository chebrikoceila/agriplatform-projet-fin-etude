import { getVapidPublicKey, pushApi } from "./api";

const SW_PATH = "/sw.js";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const subscribeToPushNotifications = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push API non supportee par ce navigateur.");
  }

  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) {
    throw new Error("VITE_VAPID_PUBLIC_KEY manquante.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permission de notification refusee.");
  }

  const registration = await navigator.serviceWorker.register(SW_PATH);
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    await pushApi.subscribe(existingSubscription.toJSON());
    return;
  }

  const newSubscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  await pushApi.subscribe(newSubscription.toJSON());
};

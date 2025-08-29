import { Platform } from "react-native";

export async function sendSilentPush(expoPushToken: string, data: any = { type: 'bg-test', ts: Date.now() }) {
  if (!expoPushToken) throw new Error('Missing Expo push token');
  
  const payload: any = {
    to: expoPushToken,
    contentAvailable: true,        // <- required for iOS background
    data,                          // <- only data, no title/body/sound
  };

  // Priority only matters for Android; iOS background must be apns-priority 5.
  if (Platform.OS === "android") {
    payload.priority = "high";
  }

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const json = await res.json();
  console.log("[BG] 🔭 Silent push result", JSON.stringify(json));
  return json;
}

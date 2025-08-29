// lib/notifications/background.ts
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";

export const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND_NOTIFICATION_TASK";

// 🚨 Define at module top-level (no function wrapper)  
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
  const startTime = Date.now();
  try {
    console.log("[BG] 🎯🎯🎯 BACKGROUND TASK TRIGGERED 🎯🎯🎯");
    console.log(`[BG] ⏰ Task started at: ${new Date().toISOString()}`);
    console.log(`[BG] 📥 RAW DATA RECEIVED: ${JSON.stringify(data, null, 2)}`);
    console.log(`[BG] 📊 EXECUTION INFO: ${JSON.stringify(executionInfo, null, 2)}`);

    if (error) {
      console.log(`[BG] ❌ Task error: ${JSON.stringify(error, null, 2)}`);
      return;
    }

    // Normalize payload from iOS/Expo shapes
    // - data?.remoteMessage?.data (Android/Firebase shape)  
    // - data?.notification?.request?.content?.data (iOS Expo)
    // - data (raw)
    const payload =
      (data as any)?.remoteMessage?.data ??
      (data as any)?.notification?.request?.content?.data ??
      (data as any) ??
      null;

    console.log(`[BG] 📦 NORMALIZED PAYLOAD: ${JSON.stringify(payload, null, 2)}`);
    console.log("[BG] 📬 Remote notification (task)", JSON.stringify({ executionInfo, payload }));

    // Check if this is our test payload or achievement check
    if (payload?.type === 'bg-test') {
      console.log('[BG] 🧪 TEST PAYLOAD DETECTED - Background task working correctly!');
      const duration = Date.now() - startTime;
      console.log(`[BG] ✅ BACKGROUND TASK COMPLETED SUCCESSFULLY in ${duration}ms`);
    } else if (payload?.type === 'ACHIEVEMENT_CHECK') {
      console.log('[BG] 🏆 ACHIEVEMENT CHECK PAYLOAD DETECTED - Processing achievements!');
      // TODO: call your achievement check here
      // await checkAchievementsSilently(payload);
      
      // For now, just log that we received it
      console.log('[BG] 🎯 Achievement check triggered successfully in background!');
      const duration = Date.now() - startTime;
      console.log(`[BG] ✅ ACHIEVEMENT CHECK COMPLETED in ${duration}ms`);
    } else {
      console.log(`[BG] ⚠️ UNEXPECTED PAYLOAD TYPE: ${payload?.type} (expected: bg-test or ACHIEVEMENT_CHECK)`);
    }

  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.log(`[BG] ❌ Handler threw after ${duration}ms: ${e?.message || String(e)}`);
    console.log(`[BG] Stack trace: ${e?.stack || 'No stack trace'}`);
  } finally {
    console.log('[BG] 🏁 BACKGROUND TASK FINISHED');
  }
});

// Persisted registration (idempotent)
export async function ensureBackgroundTaskRegistered() {
  try {
    // Check if task is defined (should be true since we define at module level)
    const isDefined = TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK);
    console.log(`[BG] 📋 Task defined: ${isDefined}`);
    
    // Check if task is registered with Expo notifications
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log(`[BG] 📋 Task registered: ${isRegistered}`);
    
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log("[BG] ✅ BACKGROUND_NOTIFICATION_TASK registered (first run)");
      
      // Verify registration succeeded
      const nowRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
      if (nowRegistered) {
        console.log("[BG] ✅ Registration verified successfully");
      } else {
        console.log("[BG] ❌ Registration failed - task still not registered");
      }
    } else {
      console.log("[BG] ✅ BACKGROUND_NOTIFICATION_TASK already registered");
    }
  } catch (error: any) {
    console.log(`[BG] ❌ Failed to register background task: ${error?.message || String(error)}`);
    throw error;
  }
}

// Foreground handler (keeps banners off even if a non-silent arrives)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    // iOS 15+
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

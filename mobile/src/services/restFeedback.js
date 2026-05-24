import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import * as Notifications from "expo-notifications";
import { Platform, Vibration } from "react-native";

let cachedPlayer = null;
let audioModeReady = false;
let scheduledNotificationId = null;

const VIBRATION_PATTERN = [0, 300, 150, 300, 150, 500];

const ensureAudioMode = async () => {
  if (audioModeReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
      shouldPlayInBackground: false,
    });
    audioModeReady = true;
  } catch (err) {
    console.warn("[restFeedback] setAudioModeAsync falhou:", err?.message);
  }
};

const loadPlayer = () => {
  if (cachedPlayer) return cachedPlayer;
  try {
    cachedPlayer = createAudioPlayer(
      require("../../assets/sounds/rest-end.mp3")
    );
    return cachedPlayer;
  } catch (err) {
    console.warn(
      "[restFeedback] rest-end.mp3 não pôde ser carregado (adicione o arquivo em mobile/assets/sounds/):",
      err?.message
    );
    return null;
  }
};

export const playRestEndFeedback = async () => {
  Vibration.vibrate(VIBRATION_PATTERN);
  await ensureAudioMode();
  const player = loadPlayer();
  if (!player) return;
  try {
    await player.seekTo(0);
    player.play();
  } catch (err) {
    console.warn("[restFeedback] play falhou:", err?.message);
  }
};

export const scheduleRestEndNotification = async (seconds) => {
  await cancelRestEndNotification();
  if (!seconds || seconds <= 0) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let granted = status === "granted";
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === "granted";
    }
    if (!granted) {
      console.warn("[restFeedback] permissão de notificação negada");
      return;
    }
    scheduledNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Descanso terminou!",
        body: "Hora da próxima série.",
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: Platform.OS === "android" ? "rest-timer" : undefined,
      },
    });
  } catch (err) {
    console.warn("[restFeedback] scheduleNotificationAsync falhou:", err?.message);
  }
};

export const cancelRestEndNotification = async () => {
  if (!scheduledNotificationId) return;
  const id = scheduledNotificationId;
  scheduledNotificationId = null;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // já disparou ou foi cancelada — ok
  }
};

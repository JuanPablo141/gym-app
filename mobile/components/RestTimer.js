import { useCallback, useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import Card from "./Card";
import {
  cancelRestEndNotification,
  playRestEndFeedback,
  scheduleRestEndNotification,
} from "../src/services/restFeedback";
import { colors, spacing } from "../src/services/theme";

const formatMMSS = (totalSeconds) => {
  const s = Math.max(0, totalSeconds);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const RestTimer = ({ visible, initialSeconds, onClose }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [hasVibrated, setHasVibrated] = useState(false);

  useEffect(() => {
    if (visible) {
      setSeconds(initialSeconds);
      setHasVibrated(false);
      scheduleRestEndNotification(initialSeconds);
    } else {
      cancelRestEndNotification();
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    if (!visible || seconds <= 0) return undefined;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [visible, seconds]);

  useEffect(() => {
    if (visible && seconds === 0 && !hasVibrated) {
      setHasVibrated(true);
      playRestEndFeedback();
      cancelRestEndNotification();
    }
  }, [visible, seconds, hasVibrated]);

  const adjustSeconds = useCallback((delta) => {
    setSeconds((current) => {
      const next = Math.max(0, current + delta);
      if (next === 0) {
        cancelRestEndNotification();
      } else {
        scheduleRestEndNotification(next);
      }
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    cancelRestEndNotification();
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <Text style={styles.label}>Descanso</Text>
          <Text style={[styles.countdown, seconds === 0 && styles.countdownDone]}>
            {formatMMSS(seconds)}
          </Text>
          <View style={styles.row}>
            <View style={styles.buttonWrap}>
              <Button
                title="−15s"
                onPress={() => adjustSeconds(-15)}
                variant="secondary"
              />
            </View>
            <View style={styles.buttonWrap}>
              <Button
                title="+15s"
                onPress={() => adjustSeconds(15)}
                variant="secondary"
              />
            </View>
          </View>
          <View style={styles.skipWrapper}>
            <Button title={seconds === 0 ? "Continuar" : "Pular"} onPress={handleClose} />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  label: {
    fontSize: 12,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  countdown: {
    fontSize: 72,
    fontWeight: "800",
    color: colors.primary,
    marginVertical: spacing.md,
    fontVariant: ["tabular-nums"],
  },
  countdownDone: {
    color: colors.danger,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
    marginTop: spacing.sm,
  },
  buttonWrap: {
    flex: 1,
  },
  skipWrapper: {
    width: "100%",
    marginTop: spacing.sm,
  },
});

export default RestTimer;

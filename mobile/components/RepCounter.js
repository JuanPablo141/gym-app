import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Accelerometer } from "expo-sensors";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const PEAK_THRESHOLD = 1.5;
const COOLDOWN_MS = 600;

const RepCounter = ({ reps, onChange }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [available, setAvailable] = useState(true);
  const lastPeakRef = useRef(0);

  useEffect(() => {
    (async () => {
      const ok = await Accelerometer.isAvailableAsync();
      setAvailable(ok);
    })();
  }, []);

  useEffect(() => {
    if (!isTracking || !available) return undefined;

    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (magnitude > PEAK_THRESHOLD && now - lastPeakRef.current > COOLDOWN_MS) {
        lastPeakRef.current = now;
        onChange((r) => r + 1);
      }
    });

    return () => sub.remove();
  }, [isTracking, available, onChange]);

  const dec = () => onChange((r) => Math.max(0, r - 1));
  const inc = () => onChange((r) => r + 1);

  return (
    <Card>
      <Text style={styles.label}>Repetições</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.bumpButton} onPress={dec}>
          <Text style={styles.bumpText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.count}>{reps}</Text>
        <TouchableOpacity style={styles.bumpButton} onPress={inc}>
          <Text style={styles.bumpText}>+</Text>
        </TouchableOpacity>
      </View>

      {!available ? (
        <Text style={styles.warning}>
          Acelerômetro indisponível neste device — use os botões manuais.
        </Text>
      ) : (
        <TouchableOpacity
          style={[styles.toggle, isTracking && styles.toggleActive]}
          onPress={() => setIsTracking((v) => !v)}
        >
          <Text style={[styles.toggleText, isTracking && styles.toggleTextActive]}>
            {isTracking ? "Pausar contagem automática" : "Iniciar contagem automática"}
          </Text>
        </TouchableOpacity>
      )}

      {Platform.OS === "web" && (
        <Text style={styles.warning}>
          Web não tem acelerômetro físico — abra no Expo Go pra contagem real.
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  count: {
    fontSize: 64,
    fontWeight: "800",
    color: colors.primary,
    minWidth: 100,
    textAlign: "center",
  },
  bumpButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bumpText: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: "600",
  },
  toggle: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: colors.surface,
  },
  warning: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default RepCounter;

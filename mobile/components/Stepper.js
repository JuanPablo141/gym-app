import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, radii, spacing } from "../src/services/theme";

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 120;

const parseNumber = (raw) => {
  if (raw === null || raw === undefined || raw === "") return null;
  const normalized = String(raw).replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const formatNumber = (n, precision) => {
  if (precision === 0) return String(Math.round(n));
  // Remove trailing zeros (80.00 -> "80", 80.5 -> "80.5")
  return String(Number(n.toFixed(precision)));
};

const Stepper = ({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Infinity,
  precision = 0,
  label,
  placeholder = "0",
  keyboardType = "decimal-pad",
}) => {
  const repeatTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const applyDelta = (delta) => {
    const current = parseNumber(value) ?? 0;
    const next = Math.min(max, Math.max(min, current + delta));
    onChange(formatNumber(next, precision));
  };

  const stopRepeat = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
  };

  const startRepeat = (delta) => {
    longPressTimerRef.current = setTimeout(() => {
      repeatTimerRef.current = setInterval(() => applyDelta(delta), REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  };

  useEffect(() => () => stopRepeat(), []);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => applyDelta(-step)}
          onPressIn={() => startRepeat(-step)}
          onPressOut={stopRepeat}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-down" size={22} color={colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          selectTextOnFocus
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => applyDelta(step)}
          onPressIn={() => startRepeat(step)}
          onPressOut={stopRepeat}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-up" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.inputBg,
  },
  button: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: colors.text,
    paddingHorizontal: spacing.sm,
  },
});

export default Stepper;

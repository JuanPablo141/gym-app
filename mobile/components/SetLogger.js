import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "./Button";
import Card from "./Card";
import { colors, radii, spacing } from "../src/services/theme";

const SetLogger = ({ sets, currentReps, suggestion, onAddSet, onResetReps }) => {
  const [weight, setWeight] = useState(
    suggestion?.weight_kg ? String(suggestion.weight_kg) : ""
  );
  const [rpe, setRpe] = useState("");

  const handleAdd = () => {
    if (currentReps <= 0) return;
    onAddSet({
      weight_kg: weight ? weight : null,
      reps: currentReps,
      rpe: rpe ? rpe : null,
    });
    onResetReps();
    setRpe("");
  };

  return (
    <Card>
      <Text style={styles.label}>Registrar série</Text>

      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
            placeholder="80.0"
          />
        </View>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>RPE</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={rpe}
            onChangeText={setRpe}
            placeholder="7-10"
          />
        </View>
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          title={`Adicionar série (${currentReps} reps)`}
          onPress={handleAdd}
          disabled={currentReps <= 0}
        />
      </View>

      {sets.length > 0 && (
        <View style={styles.history}>
          <Text style={styles.historyLabel}>Séries de hoje</Text>
          {sets.map((s, idx) => (
            <View key={idx} style={styles.historyRow}>
              <Text style={styles.historyCell}>Série {idx + 1}</Text>
              <Text style={styles.historyCell}>{s.weight_kg ?? "—"} kg</Text>
              <Text style={styles.historyCell}>{s.reps} reps</Text>
              <Text style={styles.historyCell}>RPE {s.rpe ?? "—"}</Text>
            </View>
          ))}
        </View>
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
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.inputBg,
  },
  buttonWrapper: {
    marginBottom: spacing.sm,
  },
  history: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  historyLabel: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  historyRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  historyCell: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    textAlign: "center",
  },
});

export default SetLogger;

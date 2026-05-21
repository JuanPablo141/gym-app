import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import Card from "./Card";
import Stepper from "./Stepper";
import { colors, spacing } from "../src/services/theme";

const InlineSetForm = ({
  setNumber,
  targetSets,
  targetReps,
  defaultWeight,
  defaultReps,
  onConfirm,
}) => {
  const [weight, setWeight] = useState(defaultWeight ?? "");
  const [reps, setReps] = useState(
    defaultReps !== null && defaultReps !== undefined ? String(defaultReps) : ""
  );
  const [rpe, setRpe] = useState("");

  useEffect(() => {
    setWeight(defaultWeight ?? "");
    setReps(defaultReps !== null && defaultReps !== undefined ? String(defaultReps) : "");
    setRpe("");
  }, [setNumber, defaultWeight, defaultReps]);

  const canConfirm = Number(reps) > 0;

  const handleConfirm = () => {
    onConfirm({
      weight_kg: weight ? weight : null,
      reps: Number(reps) || 0,
      rpe: rpe ? rpe : null,
    });
  };

  return (
    <Card>
      <Text style={styles.label}>
        Série {setNumber} de {targetSets}
      </Text>
      <Text style={styles.target}>Alvo: {targetReps || "—"} reps</Text>

      <View style={styles.stack}>
        <Stepper
          label="Peso (kg)"
          value={weight}
          onChange={setWeight}
          step={2.5}
          min={0}
          precision={2}
          keyboardType="decimal-pad"
        />
        <Stepper
          label="Repetições"
          value={reps}
          onChange={setReps}
          step={1}
          min={0}
          precision={0}
          keyboardType="number-pad"
        />
        <Stepper
          label="RPE (opcional)"
          value={rpe}
          onChange={setRpe}
          step={0.5}
          min={0}
          max={10}
          precision={1}
          placeholder="—"
          keyboardType="decimal-pad"
        />
      </View>

      <Button
        title="Confirmar Série"
        onPress={handleConfirm}
        disabled={!canConfirm}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  target: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  stack: {
    flexDirection: "column",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
});

export default InlineSetForm;

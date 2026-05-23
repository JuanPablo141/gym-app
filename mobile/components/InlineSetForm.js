import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button from "./Button";
import Card from "./Card";
import Stepper from "./Stepper";
import { colors, spacing } from "../src/services/theme";

const NOTE_MAX = 200;

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
  const [notes, setNotes] = useState("");
  const [notesExpanded, setNotesExpanded] = useState(false);

  useEffect(() => {
    setWeight(defaultWeight ?? "");
    setReps(defaultReps !== null && defaultReps !== undefined ? String(defaultReps) : "");
    setRpe("");
    setNotes("");
    setNotesExpanded(false);
  }, [setNumber, defaultWeight, defaultReps]);

  const canConfirm = Number(reps) > 0;

  const handleConfirm = () => {
    onConfirm({
      weight_kg: weight ? weight : null,
      reps: Number(reps) || 0,
      rpe: rpe ? rpe : null,
      notes: notes.trim(),
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

      {notesExpanded ? (
        <View style={styles.notesWrap}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Como foi essa série?"
            placeholderTextColor={colors.textSubtle}
            multiline
            maxLength={NOTE_MAX}
            style={styles.notesInput}
          />
          <Text style={styles.notesCounter}>{`${notes.length}/${NOTE_MAX}`}</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setNotesExpanded(true)}
          style={styles.notesToggle}
        >
          <Ionicons
            name="add-circle-outline"
            size={16}
            color={colors.textSubtle}
          />
          <Text style={styles.notesToggleText}>Adicionar nota</Text>
        </TouchableOpacity>
      )}

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
  notesToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  notesToggleText: {
    marginLeft: 4,
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: "600",
  },
  notesWrap: {
    marginBottom: spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    minHeight: 48,
    textAlignVertical: "top",
    backgroundColor: colors.inputBg,
  },
  notesCounter: {
    alignSelf: "flex-end",
    marginTop: 2,
    fontSize: 11,
    color: colors.textSubtle,
  },
});

export default InlineSetForm;

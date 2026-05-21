import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { MUSCLE_GROUP_LABELS } from "../src/services/constants";
import { colors, radii, spacing } from "../src/services/theme";

const TemplateExerciseEditor = ({ item, onDrag, isActive, onChange, onRemove }) => {
  const exercise = item.exercise_detail;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={onDrag}
      style={[styles.card, isActive && styles.cardActive]}
    >
      <View style={styles.header}>
        <Ionicons name="reorder-three-outline" size={22} color={colors.textSubtle} />
        <View style={styles.headerText}>
          <Text style={styles.exerciseName}>{exercise?.name ?? "Exercício"}</Text>
          <Text style={styles.exerciseGroup}>
            {MUSCLE_GROUP_LABELS[exercise?.muscle_group] ?? ""}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} hitSlop={8}>
          <Ionicons name="close-circle" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputsRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sets</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(item.target_sets)}
            onChangeText={(v) => onChange({ target_sets: Number(v) || 0 })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.input}
            value={item.target_reps}
            placeholder="8-12"
            onChangeText={(v) => onChange({ target_reps: v })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Desc. (s)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(item.rest_seconds)}
            onChangeText={(v) => onChange({ rest_seconds: Number(v) || 0 })}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardActive: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  exerciseGroup: {
    fontSize: 11,
    color: colors.textSubtle,
    marginTop: 2,
  },
  inputsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputGroup: {
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
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: colors.inputBg,
    textAlign: "center",
  },
});

export default TemplateExerciseEditor;

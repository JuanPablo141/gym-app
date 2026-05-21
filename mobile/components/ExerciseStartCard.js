import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import Card from "./Card";
import { MUSCLE_GROUP_LABELS } from "../src/services/constants";
import { colors, spacing } from "../src/services/theme";

const Stat = ({ icon, value, label }) => (
  <View style={styles.stat}>
    <Ionicons name={icon} size={20} color={colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ExerciseStartCard = ({ exercise, position, total, onStart }) => {
  const isCardio = exercise.exercise_detail?.muscle_group === "cardio";

  return (
    <View>
      <Card style={styles.heroCard}>
        <Text style={styles.eyebrow}>
          Próximo · {position} de {total}
        </Text>
        <Text style={styles.title}>{exercise.exercise_detail?.name}</Text>
        <Text style={styles.muscleGroup}>
          {MUSCLE_GROUP_LABELS[exercise.exercise_detail?.muscle_group] ?? ""}
        </Text>

        {!isCardio && (
          <View style={styles.statsRow}>
            <Stat icon="reload-outline" value={exercise.target_sets} label="séries" />
            <Stat
              icon="repeat-outline"
              value={exercise.target_reps || "—"}
              label="reps"
            />
            <Stat
              icon="time-outline"
              value={`${exercise.rest_seconds}s`}
              label="descanso"
            />
          </View>
        )}

        {isCardio && (
          <View style={styles.cardioBadge}>
            <Ionicons name="heart-outline" size={18} color={colors.primary} />
            <Text style={styles.cardioText}>Exercício de cardio com rastreamento GPS</Text>
          </View>
        )}
      </Card>

      <View style={styles.actions}>
        <Button title="Começar →" onPress={onStart} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  eyebrow: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  muscleGroup: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    marginTop: 2,
  },
  cardioBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  cardioText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  actions: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
});

export default ExerciseStartCard;

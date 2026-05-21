import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import Card from "./Card";
import { MUSCLE_GROUP_LABELS } from "../src/services/constants";
import { colors, radii, spacing } from "../src/services/theme";

const SECONDS_PER_SET = 45;
const CARDIO_SECONDS = 600;

const estimateMinutes = (exercises) => {
  let total = 0;
  exercises.forEach((ex) => {
    if (ex.exercise_detail?.muscle_group === "cardio") {
      total += CARDIO_SECONDS;
    } else {
      total += ex.target_sets * SECONDS_PER_SET;
      total += Math.max(0, ex.target_sets - 1) * ex.rest_seconds;
    }
  });
  return Math.max(1, Math.round(total / 60));
};

const Stat = ({ icon, value, label }) => (
  <View style={styles.stat}>
    <Ionicons name={icon} size={22} color={colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const WorkoutStartCard = ({ template, onStart, onCancel }) => {
  const exercises = template.exercises ?? [];
  const totalSets = exercises.reduce((sum, e) => sum + e.target_sets, 0);
  const estimated = estimateMinutes(exercises);

  return (
    <View style={styles.container}>
      <Card style={styles.heroCard}>
        <Text style={styles.eyebrow}>Pronto para começar?</Text>
        <Text style={styles.title}>{template.name}</Text>
        {template.description ? (
          <Text style={styles.description}>{template.description}</Text>
        ) : null}

        <View style={styles.statsRow}>
          <Stat icon="barbell-outline" value={exercises.length} label="exercícios" />
          <Stat icon="reload-outline" value={totalSets} label="séries" />
          <Stat icon="time-outline" value={`~${estimated}`} label="minutos" />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Roteiro de hoje</Text>
      <Card style={styles.listCard}>
        {exercises.map((ex, idx) => (
          <View
            key={ex.id ?? idx}
            style={[styles.row, idx < exercises.length - 1 && styles.rowDivider]}
          >
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{idx + 1}</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.exerciseName}>{ex.exercise_detail?.name ?? "—"}</Text>
              <Text style={styles.exerciseMeta}>
                {ex.target_sets} × {ex.target_reps || "—"} ·{" "}
                {MUSCLE_GROUP_LABELS[ex.exercise_detail?.muscle_group] ?? ""}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <View style={styles.actions}>
        <Button title="Iniciar Treino" onPress={onStart} />
        <View style={{ height: spacing.sm }} />
        <Button title="Cancelar" onPress={onCancel} variant="secondary" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
  },
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
  description: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
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
    fontSize: 22,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textLabel,
    textTransform: "uppercase",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  listCard: {
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  orderText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 14,
  },
  rowText: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  exerciseMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});

export default WorkoutStartCard;

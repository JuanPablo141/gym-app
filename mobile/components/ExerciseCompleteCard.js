import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const ExerciseCompleteCard = ({
  exerciseName,
  sets,
  onAddExtra,
  onNext,
  isLast,
}) => {
  return (
    <Card>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{exerciseName}</Text>
          <Text style={styles.subtitle}>
            {sets.length} {sets.length === 1 ? "série registrada" : "séries registradas"}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        {sets.map((s, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.cell}>Série {idx + 1}</Text>
            <Text style={styles.cell}>{s.weight_kg ?? "—"} kg</Text>
            <Text style={styles.cell}>{s.reps} reps</Text>
            <Text style={styles.cell}>RPE {s.rpe ?? "—"}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <Button title="+ Série extra" onPress={onAddExtra} variant="secondary" />
        </View>
        <View style={styles.actionButton}>
          <Button title={isLast ? "Finalizar Treino" : "Próximo →"} onPress={onNext} />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSubtle,
    marginTop: 2,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default ExerciseCompleteCard;

import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const Stat = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const ProgressionSummary = ({ progression }) => {
  if (!progression || !progression.suggestion) {
    return (
      <Card style={styles.empty}>
        <Text style={styles.emptyText}>
          Faça seu primeiro treino para começar a ver sua progressão.
        </Text>
      </Card>
    );
  }

  const { suggestion, last_top_set, personal_record } = progression;
  const weightLabel =
    suggestion.weight_kg !== null ? `${suggestion.weight_kg} kg` : "Corpo livre";

  return (
    <Card>
      <Text style={styles.title}>Próximo Treino</Text>
      <View style={styles.row}>
        <Stat label="Peso sugerido" value={weightLabel} />
        <Stat label="Reps alvo" value={suggestion.reps} />
      </View>
      <Text style={styles.rationale}>{suggestion.rationale}</Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        {last_top_set && (
          <Stat
            label="Último topo"
            value={`${last_top_set.weight_kg ?? "—"} × ${last_top_set.reps}`}
          />
        )}
        {personal_record && (
          <Stat
            label="PR"
            value={`${personal_record.weight_kg} × ${personal_record.reps}`}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: spacing.sm,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  rationale: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  empty: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSubtle,
    textAlign: "center",
    fontSize: 14,
  },
});

export default ProgressionSummary;

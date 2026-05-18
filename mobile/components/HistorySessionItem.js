import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { formatDate } from "../src/services/format";
import { colors, spacing } from "../src/services/theme";

const HistorySessionItem = ({ session }) => {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(session.started_at)}</Text>
        <Text style={styles.volume}>{session.total_volume_kg} kg</Text>
      </View>
      <View style={styles.setsTable}>
        <View style={styles.setRow}>
          <Text style={[styles.cell, styles.cellHeader]}>Série</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Peso</Text>
          <Text style={[styles.cell, styles.cellHeader]}>Reps</Text>
          <Text style={[styles.cell, styles.cellHeader]}>RPE</Text>
        </View>
        {session.sets.map((s, idx) => (
          <View key={idx} style={styles.setRow}>
            <Text style={styles.cell}>{s.set_number}</Text>
            <Text style={styles.cell}>{s.weight_kg ?? "—"}</Text>
            <Text style={styles.cell}>{s.reps}</Text>
            <Text style={styles.cell}>{s.rpe ?? "—"}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  date: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  volume: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  setsTable: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  setRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    textAlign: "center",
  },
  cellHeader: {
    fontSize: 11,
    color: colors.textSubtle,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

export default HistorySessionItem;

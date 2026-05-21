import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "./Card";
import { DAY_NAMES, getLocalPythonWeekday } from "../src/services/format";
import { colors, spacing } from "../src/services/theme";

const DaySection = ({ dayOfWeek, schedules, onAdd, onRemove }) => {
  const isToday = dayOfWeek === getLocalPythonWeekday();

  return (
    <Card style={isToday ? styles.todayCard : null}>
      <View style={styles.header}>
        <Text style={[styles.dayName, isToday && styles.todayLabel]}>
          {DAY_NAMES[dayOfWeek]}
        </Text>
        {isToday && <Text style={styles.todayBadge}>HOJE</Text>}
      </View>

      {schedules.length === 0 ? (
        <Text style={styles.emptyText}>Descanso</Text>
      ) : (
        schedules.map((sched) => (
          <View key={sched.id} style={styles.scheduleRow}>
            <Text style={styles.templateName}>
              {sched.template_detail?.name ?? "—"}
            </Text>
            <TouchableOpacity onPress={() => onRemove(sched)} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.addRow} onPress={() => onAdd(dayOfWeek)}>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addText}>Adicionar treino</Text>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  dayName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  todayLabel: {
    color: colors.primary,
  },
  todayBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.surface,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSubtle,
    fontStyle: "italic",
    paddingVertical: spacing.xs,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  templateName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    paddingVertical: 4,
  },
  addText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default DaySection;

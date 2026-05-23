import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Button from "./Button";
import Card from "./Card";
import { colors, spacing } from "../src/services/theme";

const TodaysWorkoutCard = ({ schedules, onStart, onEditSchedule }) => {
  const hasSchedules = schedules && schedules.length > 0;

  if (!hasSchedules) {
    return (
      <Card style={styles.emptyCard}>
        <Ionicons name="bed-outline" size={32} color={colors.primary} />
        <Text style={styles.emptyTitle}>Hoje é dia de descanso</Text>
        <Text style={styles.emptySubtitle}>
          Sem treino agendado pra hoje. Aproveite pra descansar — ou agende algo!
        </Text>
        <View style={styles.editButtonWrapper}>
          <Button
            title="Agendar treino"
            onPress={onEditSchedule}
            variant="secondary"
          />
        </View>
      </Card>
    );
  }

  return (
    <View>
      <Text style={styles.sectionLabel}>Treino de hoje</Text>
      {schedules.map((sched) => {
        const template = sched.template_detail;
        const exerciseCount = template?.exercises?.length ?? 0;
        return (
          <Card key={sched.id}>
            <View style={styles.row}>
              <View style={styles.textWrap}>
                <Text style={styles.title}>{template?.name ?? "Treino"}</Text>
                <Text style={styles.subtitle}>
                  {exerciseCount}{" "}
                  {exerciseCount === 1 ? "exercício" : "exercícios"}
                </Text>
              </View>
            </View>
            <View style={styles.startWrapper}>
              <Button
                title="▶ Iniciar agora"
                onPress={() => onStart(template?.id)}
              />
            </View>
          </Card>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  editButtonWrapper: {
    marginTop: spacing.md,
    width: "100%",
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  textWrap: {
    flex: 1,
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
  startWrapper: {
    marginTop: spacing.md,
  },
});

export default TodaysWorkoutCard;

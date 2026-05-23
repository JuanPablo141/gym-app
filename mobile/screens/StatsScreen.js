import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ActivityBarChart from "../components/ActivityBarChart";
import PeriodSelector from "../components/PeriodSelector";
import StatCard from "../components/StatCard";
import TemplateBreakdown from "../components/TemplateBreakdown";
import { useActivityStats } from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 180, label: "180 dias" },
  { value: 365, label: "1 ano" },
];

const formatVolume = (kg) => {
  const v = Number(kg ?? 0);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${Math.round(v)}kg`;
};

const StatsScreen = () => {
  const [days, setDays] = useState(30);
  const stats = useActivityStats(days);

  useFocusEffect(
    useCallback(() => {
      stats.refetch();
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const data = stats.data;
  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.value === days)?.label ?? `${days} dias`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Estatísticas</Text>
        <Text style={styles.subtitle}>
          Acompanhe sua frequência e volume de treino
        </Text>
      </View>

      <PeriodSelector
        options={PERIOD_OPTIONS}
        value={days}
        onChange={setDays}
      />

      <View style={styles.statsGrid}>
        <StatCard
          icon="barbell-outline"
          label="Sessões"
          value={data?.total_sessions ?? 0}
          suffix={`em ${periodLabel.toLowerCase()}`}
        />
        <StatCard
          icon="trending-up-outline"
          label="Volume total"
          value={formatVolume(data?.total_volume_kg)}
          accent="#10b981"
        />
        <StatCard
          icon="calendar-outline"
          label="Média"
          value={data?.avg_sessions_per_week ?? 0}
          suffix="/sem"
          accent="#f59e0b"
        />
        <StatCard
          icon="flame-outline"
          label="Maior sequência"
          value={data?.longest_streak_weeks ?? 0}
          suffix={
            (data?.longest_streak_weeks ?? 0) === 1 ? "semana" : "semanas"
          }
          accent="#ef4444"
        />
      </View>

      <Text style={styles.sectionTitle}>Frequência no período</Text>
      <ActivityBarChart data={data} isLoading={stats.isLoading} />

      <Text style={styles.sectionTitle}>Treinos realizados</Text>
      <TemplateBreakdown
        breakdown={data?.templates_breakdown}
        totalSessions={data?.total_sessions}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textLabel,
    textTransform: "uppercase",
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg + 4,
    marginBottom: spacing.xs,
  },
});

export default StatsScreen;

import { useCallback, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Card from "../components/Card";
import EditableNote from "../components/EditableNote";
import QueryState from "../components/QueryState";
import {
  updateSessionNotes,
  updateSetLogNotes,
  useSession,
  useSessionSummary,
} from "../src/services/hooks";
import { formatDate, formatDuration } from "../src/services/format";
import { colors, spacing } from "../src/services/theme";

const formatVolume = (kg) => {
  const v = Number(kg ?? 0);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${Math.round(v)}kg`;
};

const SessionDetailScreen = ({ route }) => {
  const { sessionId } = route.params;
  const session = useSession(sessionId);
  const summary = useSessionSummary(sessionId);

  useFocusEffect(
    useCallback(() => {
      session.refetch();
      summary.refetch();
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const setsByExerciseId = useMemo(() => {
    const map = {};
    const setLogs = session.data?.set_logs ?? [];
    setLogs.forEach((s) => {
      const eid = s.exercise_detail?.id;
      if (!eid) return;
      if (!map[eid]) map[eid] = [];
      map[eid].push(s);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => a.set_number - b.set_number)
    );
    return map;
  }, [session.data]);

  const handleSaveSessionNotes = useCallback(
    async (notes) => {
      await updateSessionNotes(sessionId, notes);
      session.refetch();
    },
    [sessionId, session]
  );

  const handleSaveSetNotes = useCallback(
    async (setLogId, notes) => {
      await updateSetLogNotes(sessionId, setLogId, notes);
      session.refetch();
    },
    [sessionId, session]
  );

  const isLoading = session.isLoading || summary.isLoading;
  const error = session.error || summary.error;
  const data = session.data;
  const sum = summary.data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          session.refetch();
          summary.refetch();
        }}
        isEmpty={!data || !sum}
        errorText="Não foi possível carregar a sessão."
        emptyText="Sessão não encontrada."
      >
        {data && sum && (
          <>
            <Card style={styles.headerCard}>
              <Text style={styles.templateName}>
                {data.template_name ?? "Treino livre"}
              </Text>
              <Text style={styles.date}>{formatDate(data.started_at)}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textSubtle} />
                  <Text style={styles.metaText}>
                    {formatDuration(data.duration_minutes)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="barbell-outline" size={14} color={colors.textSubtle} />
                  <Text style={styles.metaText}>{`${sum.exercises.length} exerc.`}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="repeat-outline" size={14} color={colors.textSubtle} />
                  <Text style={styles.metaText}>{`${sum.total_sets} séries`}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
                  <Text style={[styles.metaText, styles.metaPrimary]}>
                    {formatVolume(sum.total_volume_kg)}
                  </Text>
                </View>
              </View>

              {sum.new_prs_count > 0 && (
                <View style={styles.prBanner}>
                  <Ionicons name="trophy" size={14} color="#b45309" />
                  <Text style={styles.prBannerText}>
                    {sum.new_prs_count === 1
                      ? "1 novo PR nessa sessão!"
                      : `${sum.new_prs_count} novos PRs nessa sessão!`}
                  </Text>
                </View>
              )}

              {sum.muscle_groups_trained.length > 0 && (
                <View style={styles.chipsRow}>
                  {sum.muscle_groups_trained.map((m) => (
                    <View key={m} style={styles.chip}>
                      <Text style={styles.chipText}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.sessionNoteWrap}>
                <Text style={styles.sectionLabel}>Nota da sessão</Text>
                <EditableNote
                  value={data.notes ?? ""}
                  onSave={handleSaveSessionNotes}
                  placeholder="Como foi o treino?"
                  addLabel="Adicionar nota da sessão"
                />
              </View>
            </Card>

            {sum.exercises.map((ex) => {
              const sets = setsByExerciseId[ex.exercise_id] ?? [];
              return (
                <Card key={ex.exercise_id}>
                  <View style={styles.exHeader}>
                    <View style={styles.exTitleWrap}>
                      <Text style={styles.exName} numberOfLines={1}>
                        {ex.exercise_name}
                      </Text>
                      {ex.is_new_pr && (
                        <View style={styles.prBadge}>
                          <Ionicons name="trophy" size={11} color="#b45309" />
                          <Text style={styles.prBadgeText}>PR</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.exVolume}>{formatVolume(ex.volume_kg)}</Text>
                  </View>
                  <Text style={styles.exSubtitle}>
                    {`${ex.sets_count} séries · top: ${
                      ex.top_set.weight_kg ?? "—"
                    }kg × ${ex.top_set.reps} reps`}
                  </Text>

                  <View style={styles.setsTable}>
                    <View style={styles.setRow}>
                      <Text style={[styles.cell, styles.cellHeader]}>Série</Text>
                      <Text style={[styles.cell, styles.cellHeader]}>Peso</Text>
                      <Text style={[styles.cell, styles.cellHeader]}>Reps</Text>
                      <Text style={[styles.cell, styles.cellHeader]}>RPE</Text>
                    </View>
                    {sets.map((s) => (
                      <View key={s.id} style={styles.setBlock}>
                        <View style={styles.setRow}>
                          <Text style={styles.cell}>{s.set_number}</Text>
                          <Text style={styles.cell}>{s.weight_kg ?? "—"}</Text>
                          <Text style={styles.cell}>{s.reps}</Text>
                          <Text style={styles.cell}>{s.rpe ?? "—"}</Text>
                        </View>
                        <View style={styles.setNoteWrap}>
                          <EditableNote
                            value={s.notes ?? ""}
                            onSave={(notes) => handleSaveSetNotes(s.id, notes)}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </QueryState>
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
  headerCard: {
    paddingVertical: spacing.lg,
  },
  templateName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSubtle,
    fontWeight: "600",
  },
  metaPrimary: {
    color: colors.primary,
  },
  prBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  prBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b45309",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.divider,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  sessionNoteWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textLabel,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  exHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  exTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
    marginRight: spacing.sm,
  },
  exName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 1,
  },
  exVolume: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  prBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  prBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b45309",
  },
  exSubtitle: {
    fontSize: 12,
    color: colors.textSubtle,
    marginBottom: spacing.sm,
  },
  setsTable: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 4,
  },
  setBlock: {
    paddingVertical: 2,
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
  setNoteWrap: {
    paddingLeft: spacing.sm,
    paddingBottom: 4,
  },
});

export default SessionDetailScreen;

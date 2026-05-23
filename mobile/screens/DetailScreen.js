import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import HistorySessionItem from "../components/HistorySessionItem";
import LoadProgressChart from "../components/LoadProgressChart";
import ProgressionSummary from "../components/ProgressionSummary";
import QueryState from "../components/QueryState";
import VolumeProgressChart from "../components/VolumeProgressChart";
import { MUSCLE_GROUP_LABELS } from "../src/services/constants";
import {
  useExerciseDetail,
  useExerciseHistory,
  useExerciseProgression,
  useExerciseVolumeTrend,
} from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const DetailScreen = ({ navigation, route }) => {
  const { exerciseId, exerciseName } = route.params ?? {};

  const detail = useExerciseDetail(exerciseId);
  const progression = useExerciseProgression(exerciseId);
  const volumeTrend = useExerciseVolumeTrend(exerciseId);
  const history = useExerciseHistory(exerciseId);

  useEffect(() => {
    if (exerciseName) {
      navigation.setOptions({ title: exerciseName });
    }
  }, [exerciseName, navigation]);

  const handleStartWorkout = () => {
    navigation.navigate("Workout", { exerciseId, exerciseName });
  };

  // O header só precisa do detail. Sections (progression/history) carregam por conta própria.
  if (detail.isLoading || detail.error) {
    return (
      <QueryState
        isLoading={detail.isLoading}
        error={detail.error}
        onRetry={detail.refetch}
        errorText="Não foi possível carregar o exercício."
      />
    );
  }

  const exercise = detail.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <Text style={styles.groupBadge}>
          {MUSCLE_GROUP_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
        </Text>
        <Text style={styles.title}>{exercise.name}</Text>
        {exercise.description ? (
          <Text style={styles.description}>{exercise.description}</Text>
        ) : (
          <Text style={styles.descriptionEmpty}>Sem instruções cadastradas.</Text>
        )}
      </Card>

      <View style={styles.startButtonWrapper}>
        <Button title="Iniciar Treino" onPress={handleStartWorkout} />
      </View>

      <Text style={styles.sectionTitle}>Sugestão de Carga</Text>
      {progression.isLoading ? (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ProgressionSummary progression={progression.data} />
      )}

      <Text style={styles.sectionTitle}>Evolução da Carga</Text>
      <LoadProgressChart
        trend={progression.data?.trend}
        isLoading={progression.isLoading}
      />

      <Text style={styles.sectionTitle}>Evolução do Volume</Text>
      <VolumeProgressChart
        data={volumeTrend.data}
        isLoading={volumeTrend.isLoading}
      />

      <Text style={styles.sectionTitle}>Histórico</Text>
      {history.isLoading && (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      {!history.isLoading && history.error && (
        <Card style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryText}>
            Não foi possível carregar o histórico.
          </Text>
        </Card>
      )}
      {!history.isLoading &&
        !history.error &&
        (history.data && history.data.length > 0 ? (
          history.data.map((session) => (
            <HistorySessionItem key={session.id} session={session} />
          ))
        ) : (
          <Card style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>
              Nenhuma sessão registrada ainda.
            </Text>
          </Card>
        ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: spacing.xl + 8,
  },
  headerCard: {
    marginTop: spacing.md,
  },
  groupBadge: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  descriptionEmpty: {
    fontSize: 13,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  startButtonWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
  inlineLoading: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyHistory: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyHistoryText: {
    fontSize: 13,
    color: colors.textSubtle,
  },
});

export default DetailScreen;

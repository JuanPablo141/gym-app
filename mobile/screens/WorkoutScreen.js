import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import QueryState from "../components/QueryState";
import RepCounter from "../components/RepCounter";
import RouteTracker from "../components/RouteTracker";
import SetLogger from "../components/SetLogger";
import { MUSCLE_GROUP_LABELS } from "../src/services/constants";
import {
  createWorkoutSession,
  useExerciseDetail,
  useExerciseProgression,
} from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const WorkoutScreen = ({ navigation, route }) => {
  const { exerciseId, exerciseName } = route.params ?? {};

  const detail = useExerciseDetail(exerciseId);
  const progression = useExerciseProgression(exerciseId);

  const startedAtRef = useRef(new Date().toISOString());

  const [reps, setReps] = useState(0);
  const [sets, setSets] = useState([]);
  const [points, setPoints] = useState([]);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (exerciseName) {
      navigation.setOptions({ title: exerciseName });
    }
  }, [exerciseName, navigation]);

  const handleFinish = useCallback(async () => {
    if (!detail.data) return;
    const isCardio = detail.data.muscle_group === "cardio";
    if (isCardio && points.length === 0) {
      Alert.alert("Nada pra salvar", "Inicie o rastreamento de rota primeiro.");
      return;
    }
    if (!isCardio && sets.length === 0) {
      Alert.alert("Nada pra salvar", "Adicione pelo menos uma série.");
      return;
    }

    const payload = {
      started_at: startedAtRef.current,
      finished_at: new Date().toISOString(),
      ...(isCardio
        ? { route_data: points }
        : {
            set_logs: sets.map((s, idx) => ({
              exercise: exerciseId,
              set_number: idx + 1,
              weight_kg: s.weight_kg,
              reps: s.reps,
              rpe: s.rpe,
            })),
          }),
    };

    setIsFinishing(true);
    try {
      await createWorkoutSession(payload);
      Alert.alert("Treino salvo!", "Sua sessão foi registrada.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const detailMsg =
        err?.response?.data?.detail ?? "Não foi possível salvar a sessão.";
      Alert.alert("Erro", detailMsg);
    } finally {
      setIsFinishing(false);
    }
  }, [detail.data, points, sets, exerciseId, navigation]);

  const handleAddSet = useCallback((set) => {
    setSets((prev) => [...prev, set]);
  }, []);

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
  const isCardio = exercise.muscle_group === "cardio";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.groupBadge}>
          {MUSCLE_GROUP_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
        </Text>
        <Text style={styles.title}>{exercise.name}</Text>
        {progression.data?.suggestion && !isCardio && (
          <Text style={styles.suggestion}>
            Sugestão: {progression.data.suggestion.weight_kg ?? "Corpo livre"} kg ×{" "}
            {progression.data.suggestion.reps} reps
          </Text>
        )}
      </Card>

      {isCardio ? (
        <RouteTracker points={points} onChange={setPoints} />
      ) : (
        <>
          <RepCounter reps={reps} onChange={setReps} />
          <SetLogger
            sets={sets}
            currentReps={reps}
            suggestion={progression.data?.suggestion}
            onAddSet={handleAddSet}
            onResetReps={() => setReps(0)}
          />
        </>
      )}

      <View style={styles.finishWrapper}>
        <Button
          title="Finalizar Treino"
          onPress={handleFinish}
          loading={isFinishing}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 8,
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
  },
  suggestion: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: spacing.sm,
  },
  finishWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
});

export default WorkoutScreen;

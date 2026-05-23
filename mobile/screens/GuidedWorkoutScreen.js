import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import ExerciseCompleteCard from "../components/ExerciseCompleteCard";
import ExerciseStartCard from "../components/ExerciseStartCard";
import InlineSetForm from "../components/InlineSetForm";
import NextUpPreview from "../components/NextUpPreview";
import QueryState from "../components/QueryState";
import RestTimer from "../components/RestTimer";
import RouteTracker from "../components/RouteTracker";
import WorkoutProgressBar from "../components/WorkoutProgressBar";
import WorkoutStartCard from "../components/WorkoutStartCard";
import { MUSCLE_GROUP_LABELS } from "../src/services/constants";
import { createWorkoutSession, useTemplateDetail } from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const PHASE = {
  PRE_WORKOUT: "PRE_WORKOUT",
  BETWEEN_EXERCISES: "BETWEEN_EXERCISES",
  LOGGING: "LOGGING",
  RESTING: "RESTING",
  EXERCISE_DONE: "EXERCISE_DONE",
  CARDIO: "CARDIO",
};

const parseFirstInt = (raw) => {
  if (!raw) return null;
  const match = String(raw).match(/\d+/);
  return match ? Number(match[0]) : null;
};

const isCardio = (templateExercise) =>
  templateExercise?.exercise_detail?.muscle_group === "cardio";

const initialPhaseFor = (templateExercise) =>
  isCardio(templateExercise) ? PHASE.CARDIO : PHASE.LOGGING;

const GuidedWorkoutScreen = ({ navigation, route }) => {
  const { templateId } = route.params ?? {};
  const detail = useTemplateDetail(templateId);

  // startedAt só conta quando o usuário confirma "Iniciar Treino"
  const startedAtRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [setsByExercise, setSetsByExercise] = useState({});
  const [routePoints, setRoutePoints] = useState([]);
  const [phase, setPhase] = useState(PHASE.PRE_WORKOUT);
  const [isFinishing, setIsFinishing] = useState(false);

  const exercises = useMemo(() => detail.data?.exercises ?? [], [detail.data]);
  const current = exercises[currentIndex];
  const next = exercises[currentIndex + 1];
  const isLast = currentIndex === exercises.length - 1;

  // Chave por templateExercise.id (não por exercise.id) — assim o mesmo exercício
  // pode aparecer em posições diferentes do template sem compartilhar estado.
  const currentSets = current ? setsByExercise[current.id] ?? [] : [];
  const nextSetNumber = currentSets.length + 1;

  // Quando troca de exercício, reseta a fase. NÃO dispara antes do usuário
  // confirmar "Iniciar Treino" (fica em PRE_WORKOUT).
  useEffect(() => {
    if (current && phase !== PHASE.PRE_WORKOUT) {
      setPhase(initialPhaseFor(current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const hasProgress =
    Object.values(setsByExercise).some((arr) => arr.length > 0) || routePoints.length > 0;
  const hasProgressRef = useRef(hasProgress);
  hasProgressRef.current = hasProgress;

  useEffect(() => {
    if (detail.data?.name) {
      navigation.setOptions({ title: detail.data.name });
    }
  }, [detail.data, navigation]);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!hasProgressRef.current) return;
      e.preventDefault();
      Alert.alert(
        "Sair do treino?",
        "Sessão em andamento. Sair vai descartar o progresso. Confirmar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Sair",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsub;
  }, [navigation]);

  const handleStartWorkout = useCallback(() => {
    startedAtRef.current = new Date().toISOString();
    setPhase(initialPhaseFor(exercises[0]));
  }, [exercises]);

  const handleCancelPreWorkout = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConfirmSet = useCallback(
    (set) => {
      if (!current) return;
      const updated = [...(setsByExercise[current.id] ?? []), set];
      setSetsByExercise((prev) => ({ ...prev, [current.id]: updated }));

      if (updated.length >= current.target_sets) {
        setPhase(PHASE.EXERCISE_DONE);
      } else {
        setPhase(PHASE.RESTING);
      }
    },
    [current, setsByExercise]
  );

  const handleRestComplete = useCallback(() => {
    setPhase(PHASE.LOGGING);
  }, []);

  const handleAdvanceExercise = useCallback(() => {
    if (isLast) return;
    // Em vez de pular direto pro próximo, mostra a tela de transição.
    setPhase(PHASE.BETWEEN_EXERCISES);
  }, [isLast]);

  const handleStartNextExercise = useCallback(() => {
    // Avança o índice; o useEffect de mudança de currentIndex reseta a fase
    // pra LOGGING ou CARDIO conforme o tipo do exercício.
    setCurrentIndex((i) => i + 1);
  }, []);

  const handleAddExtraSet = useCallback(() => {
    setPhase(PHASE.RESTING);
  }, []);

  const handleSkipExercise = useCallback(() => {
    if (!current) return;
    Alert.alert(
      "Pular exercício",
      "Séries registradas deste exercício serão descartadas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Pular",
          style: "destructive",
          onPress: () => {
            setSetsByExercise((prev) => {
              const next = { ...prev };
              delete next[current.id];
              return next;
            });
            if (isLast) {
              handleFinish();
            } else {
              // Skip pula a tela de transição — vai direto pro próximo.
              setCurrentIndex((i) => i + 1);
            }
          },
        },
      ]
    );
  }, [current, isLast]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinish = useCallback(async () => {
    // Backend tem unique_together=(session, exercise, set_number). Se o template
    // tem o mesmo exercício em posições diferentes, precisamos renumerar
    // continuamente — agrupando por exercise UUID, não por posição.
    const groupedByExercise = {};
    exercises.forEach((ex) => {
      const sets = setsByExercise[ex.id] ?? [];
      if (sets.length === 0) return;
      const exerciseId = ex.exercise_detail?.id;
      if (!exerciseId) return;
      if (!groupedByExercise[exerciseId]) groupedByExercise[exerciseId] = [];
      groupedByExercise[exerciseId].push(...sets);
    });

    const allSets = Object.entries(groupedByExercise).flatMap(([exerciseId, sets]) =>
      sets.map((s, idx) => ({
        exercise: exerciseId,
        set_number: idx + 1,
        weight_kg: s.weight_kg,
        reps: s.reps,
        rpe: s.rpe,
        notes: s.notes ?? "",
      }))
    );

    if (allSets.length === 0 && routePoints.length === 0) {
      Alert.alert("Nada pra salvar", "Você não registrou nenhuma série.");
      return;
    }

    const payload = {
      template: templateId,
      started_at: startedAtRef.current,
      finished_at: new Date().toISOString(),
      set_logs: allSets,
      ...(routePoints.length > 0 && { route_data: routePoints }),
    };

    setIsFinishing(true);
    try {
      await createWorkoutSession(payload);
      hasProgressRef.current = false;
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
  }, [exercises, setsByExercise, routePoints, templateId, navigation]);

  if (detail.isLoading || detail.error) {
    return (
      <QueryState
        isLoading={detail.isLoading}
        error={detail.error}
        onRetry={detail.refetch}
        errorText="Não foi possível carregar o treino."
      />
    );
  }

  if (exercises.length === 0) {
    return (
      <QueryState
        isLoading={false}
        error={null}
        isEmpty
        emptyText="Este treino não tem exercícios."
      />
    );
  }

  const lastSet = currentSets[currentSets.length - 1];
  const defaultWeight = lastSet?.weight_kg ?? "";
  const defaultReps = parseFirstInt(current.target_reps);

  const NextUp = () => {
    if (phase === PHASE.LOGGING || phase === PHASE.RESTING) {
      if (phase === PHASE.RESTING && nextSetNumber <= current.target_sets) {
        return (
          <NextUpPreview
            icon="repeat-outline"
            label="Próxima série"
            title={`Série ${nextSetNumber} de ${current.target_sets}`}
            subtitle={
              defaultWeight
                ? `Sugestão: ${defaultWeight} kg × ${defaultReps ?? "?"} reps`
                : `Sugestão: ${defaultReps ?? "?"} reps`
            }
          />
        );
      }
      if (next) {
        return (
          <NextUpPreview
            icon="arrow-forward"
            label="Próximo exercício"
            title={next.exercise_detail?.name ?? ""}
            subtitle={`${next.target_sets} × ${next.target_reps || "—"}`}
          />
        );
      }
      return (
        <NextUpPreview
          icon="flag-outline"
          label="Última etapa"
          title="Finalizar treino"
        />
      );
    }
    return null;
  };

  if (phase === PHASE.PRE_WORKOUT) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <WorkoutStartCard
          template={detail.data}
          onStart={handleStartWorkout}
          onCancel={handleCancelPreWorkout}
        />
      </ScrollView>
    );
  }

  if (phase === PHASE.BETWEEN_EXERCISES && next) {
    return (
      <View style={styles.container}>
        <WorkoutProgressBar current={currentIndex + 2} total={exercises.length} />
        <ScrollView contentContainerStyle={styles.content}>
          <ExerciseStartCard
            exercise={next}
            position={currentIndex + 2}
            total={exercises.length}
            onStart={handleStartNextExercise}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WorkoutProgressBar current={currentIndex + 1} total={exercises.length} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.step}>
            Exercício {currentIndex + 1} de {exercises.length}
          </Text>
          <Text style={styles.title}>{current.exercise_detail?.name}</Text>
          <Text style={styles.muscleGroup}>
            {MUSCLE_GROUP_LABELS[current.exercise_detail?.muscle_group] ?? ""}
          </Text>
          <Text style={styles.target}>
            Alvo: {current.target_sets} × {current.target_reps || "—"} · {current.rest_seconds}s descanso
          </Text>
        </Card>

        {phase === PHASE.LOGGING && (
          <InlineSetForm
            setNumber={nextSetNumber}
            targetSets={current.target_sets}
            targetReps={current.target_reps}
            defaultWeight={defaultWeight}
            defaultReps={defaultReps}
            onConfirm={handleConfirmSet}
          />
        )}

        {phase === PHASE.CARDIO && (
          <>
            <RouteTracker points={routePoints} onChange={setRoutePoints} />
            <View style={styles.cardioDoneWrapper}>
              <Button
                title="Concluir cardio"
                onPress={() => setPhase(PHASE.EXERCISE_DONE)}
              />
            </View>
          </>
        )}

        {phase === PHASE.EXERCISE_DONE && (
          <ExerciseCompleteCard
            exerciseName={current.exercise_detail?.name ?? ""}
            sets={currentSets}
            onAddExtra={handleAddExtraSet}
            onNext={isLast ? handleFinish : handleAdvanceExercise}
            isLast={isLast}
          />
        )}

        <NextUp />

        {phase !== PHASE.EXERCISE_DONE && (
          <View style={styles.skipWrapper}>
            <Button
              title={isLast ? "Pular e finalizar" : "Pular exercício"}
              onPress={handleSkipExercise}
              variant="secondary"
            />
          </View>
        )}

        {isFinishing && (
          <Text style={styles.savingText}>Salvando treino…</Text>
        )}
      </ScrollView>

      <RestTimer
        visible={phase === PHASE.RESTING}
        initialSeconds={current?.rest_seconds ?? 90}
        onClose={handleRestComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl + 8,
  },
  step: {
    fontSize: 11,
    color: colors.textSubtle,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xs,
  },
  muscleGroup: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  target: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  cardioDoneWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  skipWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  savingText: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});

export default GuidedWorkoutScreen;

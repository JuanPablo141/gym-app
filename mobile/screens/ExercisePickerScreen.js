import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ExerciseListItem from "../components/ExerciseListItem";
import QueryState from "../components/QueryState";
import { MUSCLE_GROUPS } from "../src/services/constants";
import { useExercises } from "../src/services/hooks";
import { colors, spacing } from "../src/services/theme";

const ExercisePickerScreen = ({ navigation, route }) => {
  const onPick = route.params?.onPick;
  const [muscleGroup, setMuscleGroup] = useState(null);
  const { data, isLoading, error, refetch } = useExercises({ muscleGroup });

  useEffect(() => {
    navigation.setOptions({ title: "Escolher exercício" });
  }, [navigation]);

  const handlePick = useCallback(
    (exercise) => {
      onPick?.(exercise);
      navigation.goBack();
    },
    [onPick, navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ExerciseListItem exercise={item} onPress={() => handlePick(item)} />
    ),
    [handlePick]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Chip
          label="Todos"
          active={muscleGroup === null}
          onPress={() => setMuscleGroup(null)}
        />
        {MUSCLE_GROUPS.map((g) => (
          <Chip
            key={g.key}
            label={g.label}
            active={muscleGroup === g.key}
            onPress={() => setMuscleGroup(g.key)}
            color={g.color}
          />
        ))}
      </ScrollView>

      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        isEmpty={!data || data.length === 0}
        errorText="Não foi possível carregar os exercícios."
        emptyText="Nenhum exercício neste grupo."
      >
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </QueryState>
    </View>
  );
};

const Chip = ({ label, active, onPress, color }) => (
  <TouchableOpacity
    style={[styles.chip, active && { backgroundColor: color ?? colors.primary }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {active && (
      <Ionicons name="checkmark" size={14} color={colors.surface} style={{ marginRight: 4 }} />
    )}
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  chipsRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.surface,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
});

export default ExercisePickerScreen;
